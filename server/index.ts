import dotenv from "dotenv";
dotenv.config();
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import pg from "pg";
import PgSession from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
// ✅ Serve the built frontend files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

// ✅ PostgreSQL Session Store
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL, // Use your database URL from env
  ssl: { rejectUnauthorized: false }, // Required for NeonDB
});

app.use(
  session({
    store: new (PgSession(session))({
      pool: pgPool, // Use PostgreSQL pool
      tableName: "session", // Name of the table (change if needed)
    }),
    secret: process.env.SESSION_SECRET || "fallback_secret", // Use a secure session secret
    resave: false,
    saveUninitialized: false, // Set to false for security
    cookie: {
      secure: process.env.NODE_ENV === "production", // Secure cookies in production
      maxAge: 1000 * 60 * 60 * 24, // 1 day expiration
    },
  })
);

app.get("/", (req, res) => {
  res.send("Welcome to Employee Log Tracker!");
});

(async () => {
  try {
    const server = registerRoutes(app);

    storage.initDefaultAdmin().catch(console.error);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${message}`);
      res.status(status).json({ message });
    });

    const PORT = Number(process.env.PORT) || 5000;
    log(`Starting server on port ${PORT}`);

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });

  } catch (error) {
    log(`Failed to start server: ${error}`);
    process.exit(1);
  }
})();
