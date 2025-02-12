import { logs, users, type User, type InsertUser, type Log, type InsertLog } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;
  createLog(log: InsertLog): Promise<Log>;
  getLogsByUserId(userId: number): Promise<Log[]>;
  getAllLogs(): Promise<Log[]>;
  deleteLog(id: number): Promise<void>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private logs: Map<number, Log>;
  private currentUserId: number;
  private currentLogId: number;
  readonly sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.logs = new Map();
    this.currentUserId = 1;
    this.currentLogId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { id, isAdmin: false, ...insertUser };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(id: number): Promise<void> {
    this.users.delete(id);
    // Delete associated logs
    const userLogs = await this.getLogsByUserId(id);
    for (const log of userLogs) {
      this.logs.delete(log.id);
    }
  }

  async createLog(insertLog: InsertLog): Promise<Log> {
    const id = this.currentLogId++;
    const log: Log = { id, createdAt: new Date(), ...insertLog };
    this.logs.set(id, log);
    return log;
  }

  async getLogsByUserId(userId: number): Promise<Log[]> {
    return Array.from(this.logs.values()).filter(
      (log) => log.userId === userId,
    );
  }

  async getAllLogs(): Promise<Log[]> {
    return Array.from(this.logs.values());
  }

  async deleteLog(id: number): Promise<void> {
    this.logs.delete(id);
  }
}

export const storage = new MemStorage();