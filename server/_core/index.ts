import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startBatchProcessor } from "../emailBatching";
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

  // ── Iframe Embedding Support ──────────────────────────────────
  // Allow the site to be embedded in iframes on any external website.
  // This middleware runs before all other routes so every response
  // carries the correct headers.
  app.use((_req, res, next) => {
    // Remove any default X-Frame-Options that might block embedding
    res.removeHeader("X-Frame-Options");
    // Explicitly allow framing from any origin
    res.setHeader("Content-Security-Policy", "frame-ancestors *");
    // Allow cross-origin requests for embedded assets
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    // Handle preflight OPTIONS requests
    if (_req.method === "OPTIONS") {
      return res.status(204).end();
    }
    next();
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
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
  });
}

startServer().catch(console.error);
