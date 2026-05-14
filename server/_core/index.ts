import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startBatchProcessor } from "../emailBatching";
import { startScheduledJobs } from "../notificationService";
import { registerOgRoutes } from "../ogImage";
import { storageDownload, storagePut } from "../storage";
import { sdk } from "./sdk";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Trust proxy headers from load balancers/reverse proxies (required for rate limiting)
  app.set("trust proxy", 1);

  // ── Resend webhook: must capture raw body BEFORE json() middleware ──────────
  // svix signature verification requires the exact raw bytes sent by Resend.
  const { handleResendWebhook } = await import("../webhooks/resend");
  app.post(
    "/api/webhooks/resend",
    express.raw({ type: "application/json" }),
    (req, _res, next) => {
      // Attach raw body buffer so the handler can access it for signature verification
      (req as typeof req & { rawBody?: Buffer }).rawBody = req.body as Buffer;
      // Re-parse as JSON so downstream code can use req.body normally
      try { req.body = JSON.parse((req.body as Buffer).toString("utf8")); } catch { /* ignore */ }
      next();
    },
    handleResendWebhook
  );

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // --- Iframe Embedding: Dual CSP Middleware ---
  // Parse allowed origins from env (comma-separated)
  const embedAllowedOrigins = (process.env.EMBED_ALLOWED_ORIGINS || "")
    .split(",")
    .map(o => o.trim())
    .filter(Boolean);

  // For /embed/* routes: allow framing from approved domains
  app.use("/embed", (req, res, next) => {
    // Build frame-ancestors value: 'self' + approved domains
    const frameAncestors = ["'self'", ...embedAllowedOrigins].join(" ");
    res.setHeader("Content-Security-Policy", `frame-ancestors ${frameAncestors}`);
    // Remove X-Frame-Options if set by upstream proxy
    res.removeHeader("X-Frame-Options");
    // CORS headers for cross-origin asset loading
    const origin = req.headers.origin;
    if (origin && embedAllowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  });

  // For all non-embed routes: block external framing
  app.use((req, res, next) => {
    if (!req.path.startsWith("/embed")) {
      res.setHeader("Content-Security-Policy", "frame-ancestors 'self'");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
    }
    next();
  });

  // 301 redirect: normalize double-dash slugs in drill URLs
  app.use((req, res, next) => {
    if ((req.path.startsWith('/drill/') || req.path.startsWith('/embed/drill/')) && /--/.test(req.path)) {
      const cleaned = req.path.replace(/--+/g, '-');
      return res.redirect(301, cleaned);
    }
    next();
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // --- Multipart video upload route (bypasses tRPC body size limits) ---
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB (compression reduces most files well below this)
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("video/")) {
        cb(null, true);
      } else {
        cb(new Error("Only video files are allowed"));
      }
    },
  });

  app.post("/api/upload/video", upload.single("video"), async (req, res) => {
    try {
      // Authenticate the request
      const user = await sdk.authenticateRequest(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No video file provided" });
      }

      const assignmentId = req.body?.assignmentId || "0";
      const drillId = req.body?.drillId || "unknown";

      // Create S3 key
      const timestamp = Date.now();
      const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileKey = `drill-submissions/${user.id}/${drillId}/${timestamp}-${sanitizedFileName}`;

      // Upload to S3
      const uploadResult = await storagePut(fileKey, file.buffer, file.mimetype);

      console.log(`[Video Upload] User ${user.id} uploaded ${file.originalname} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);

      return res.json({
        success: true,
        videoUrl: uploadResult.url,
        fileKey: uploadResult.key,
      });
    } catch (error: any) {
      console.error("[Video Upload] Failed:", error);
      if (error.message === "Invalid session cookie" || error.message?.includes("session")) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      return res.status(500).json({ error: error.message || "Upload failed" });
    }
  });

  // Image proxy route to serve storage images
  app.get("/api/storage/image/*", async (req, res) => {
    try {
      const imagePath = (req.params as Record<string, string>)[0];
      if (!imagePath) {
        return res.status(400).json({ error: "Image path required" });
      }
      
      // Download the file content directly from storage API
      const { data, contentType } = await storageDownload(imagePath);
      
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
      res.send(data);
    } catch (error) {
      console.error("Image proxy error:", error);
      res.status(500).json({ error: "Failed to proxy image" });
    }
  });
  // Serve drill customization images with HTTP caching
  app.get("/api/drill-image/:drillId", async (req, res) => {
    try {
      const { getDrillCustomization } = await import("../drillCustomizations");
      const c = await getDrillCustomization(req.params.drillId);
      if (!c) return res.status(404).end();

      // Prefer imageBase64 column; fall back to thumbnailUrl if it's a data: URI
      let base64Data = c.imageBase64;
      let mimeType = c.imageMimeType || "image/jpeg";

      if (!base64Data && c.thumbnailUrl?.startsWith("data:")) {
        // Parse data URI: data:<mime>;base64,<data>
        const match = c.thumbnailUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      }

      if (!base64Data) return res.status(404).end();

      const buf = Buffer.from(base64Data, "base64");
      res.set("Content-Type", mimeType);
      res.set("Cache-Control", "public, max-age=86400, immutable");
      res.send(buf);
    } catch (error) {
      console.error("Drill image serve error:", error);
      res.status(500).end();
    }
  });

  // Dynamic OG image generation for drill detail pages
  registerOgRoutes(app);

  // Rate limiting on public API endpoints (60 req/min per IP, skip authenticated users)
  const publicApiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
    skip: (req) => {
      // Skip rate limiting for authenticated users (they have a session cookie)
      return !!req.headers.cookie?.includes('session=');
    },
  });
  app.use('/api/trpc', publicApiLimiter);

  // Health check: scheduled jobs status + webhook health
  const { getJobHealthStatus } = await import("../notificationService");
  const { getLastWebhookReceivedAt } = await import("../webhooks/resend");
  app.get("/api/health/jobs", (_req, res) => {
    const jobHealth = getJobHealthStatus();
    const lastWebhook = getLastWebhookReceivedAt();
    res.json({
      ...jobHealth,
      webhook: {
        lastResendEventAt: lastWebhook,
        status: lastWebhook ? "active" : "no_events_yet",
      },
    });
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path }) {
        console.error(`[tRPC Error] ${path ?? 'unknown'}:`, error.message);
      },
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Start email batch processor for rate-limited activity alerts
    startBatchProcessor();
    startScheduledJobs();
  });
}

startServer().catch(console.error);
