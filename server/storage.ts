import { logs, users, type User, type InsertUser, type Log, type InsertLog } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import bcrypt from 'bcrypt'; // Added bcrypt for password hashing

const PostgresSessionStore = connectPg(session);

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
  updateLog(id: number, data: InsertLog): Promise<Log | undefined>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  readonly sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
    // Delete associated logs
    await db.delete(logs).where(eq(logs.userId, id));
  }

  async createLog(insertLog: InsertLog): Promise<Log> {
    const [log] = await db.insert(logs).values(insertLog).returning();
    return log;
  }

  async getLogsByUserId(userId: number): Promise<Log[]> {
    return await db.select().from(logs).where(eq(logs.userId, userId));
  }

  async getAllLogs(): Promise<Log[]> {
    return await db.select().from(logs);
  }

  async deleteLog(id: number): Promise<void> {
    await db.delete(logs).where(eq(logs.id, id));
  }

  async updateLog(id: number, data: InsertLog): Promise<Log | undefined> {
    const [updated] = await db.update(logs)
      .set({
        userId: data.userId,
        date: data.date,
        task: data.task,
        wordCount: data.wordCount
      })
      .where(eq(logs.id, id))
      .returning();
    return updated;
  }
}


async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

async function initDefaultAdmin() {
  const adminUser = await db.query.users.findFirst({
    where: eq(users.username, "edtech.arsh@gmail.com")
  });

  if (!adminUser) {
    await db.insert(users).values({
      username: "edtech.arsh@gmail.com",
      password: await hashPassword("arsh@123?"),
      fullName: "Admin",
      isAdmin: true
    });
  }
}

export const storage = new DatabaseStorage();
export { initDefaultAdmin }; // Exported for use elsewhere in the application