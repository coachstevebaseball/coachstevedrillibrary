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

  // Health check: scheduled jobs status
  const { getJobHealthStatus } = await import("../notificationService");
  app.get("/api/health/jobs", (_req, res) => {
    res.json(getJobHealthStatus());
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
