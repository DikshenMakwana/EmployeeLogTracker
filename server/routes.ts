import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertLogSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Admin-only middleware
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).send("Admin access required");
    }
    next();
  };

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    await storage.deleteUser(Number(req.params.id));
    res.sendStatus(200);
  });

  app.get("/api/admin/logs", requireAdmin, async (_req, res) => {
    const logs = await storage.getAllLogs();
    res.json(logs);
  });

  // Log routes
  app.post("/api/logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const parsed = insertLogSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const log = await storage.createLog(parsed.data);
    res.status(201).json(log);
  });

  app.get("/api/logs/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = Number(req.params.userId);
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).send("Access denied");
    }

    const logs = await storage.getLogsByUserId(userId);
    res.json(logs);
  });

  app.delete("/api/logs/:id", requireAdmin, async (req, res) => {
    await storage.deleteLog(Number(req.params.id));
    res.sendStatus(200);
  });

  const httpServer = createServer(app);
  return httpServer;
}
