import { logs, users, type User, type InsertUser, type Log, type InsertLog } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import bcrypt from 'bcrypt';

const PostgresSessionStore = connectPg(session);

const sessionStore = new PostgresSessionStore({
  pool,
  createTableIfMissing: true,
});

sessionStore.on('error', (err) => {
  console.error("❌ Session store error:", err);
  process.exit(1);
});

// export interface IStorage {
//   getUser(id: number): Promise<User | undefined>;
//   getUserByUsername(username: string): Promise<User | undefined>;
//   createUser(user: InsertUser): Promise<User>;
//   getAllUsers(): Promise<User[]>;
//   deleteUser(id: number): Promise<void>;
//   createLog(log: InsertLog): Promise<Log>;
//   getLogsByUserId(userId: number): Promise<Log[]>;
//   getAllLogs(): Promise<Log[]>;
//   deleteLog(id: number): Promise<void>;
//   updateLog(id: number, data: InsertLog): Promise<Log | undefined>;
//   updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
//   sessionStore: session.Store;
// }

// export class DatabaseStorage implements IStorage {
//   readonly sessionStore: session.Store;

//   constructor() {
//     this.sessionStore = new PostgresSessionStore({
//       pool,
//       createTableIfMissing: true,
//     });
//   }

//   async getUser(id: number): Promise<User | undefined> {
//     const [user] = await db.select().from(users).where(eq(users.id, id));
//     return user;
//   }

//   async getUserByUsername(username: string): Promise<User | undefined> {
//     const [user] = await db.select().from(users).where(eq(users.username, username));
//     return user;
//   }

//   async createUser(insertUser: InsertUser): Promise<User> {
//     const [user] = await db.insert(users).values(insertUser).returning();
//     return user;
//   }

//   async getAllUsers(): Promise<User[]> {
//     return await db.select().from(users);
//   }

//   async deleteUser(id: number): Promise<void> {
//     await db.delete(users).where(eq(users.id, id));
//     // Delete associated logs
//     await db.delete(logs).where(eq(logs.userId, id));
//   }

//   async createLog(insertLog: InsertLog): Promise<Log> {
//     const [log] = await db.insert(logs).values(insertLog).returning();
//     return log;
//   }

//   async getLogsByUserId(userId: number): Promise<Log[]> {
//     return await db.select().from(logs).where(eq(logs.userId, userId));
//   }

//   async getAllLogs(): Promise<Log[]> {
//     return await db.select().from(logs);
//   }

//   async deleteLog(id: number): Promise<void> {
//     await db.delete(logs).where(eq(logs.id, id));
//   }

//   async updateLog(id: number, data: InsertLog): Promise<Log | undefined> {
//     const [updated] = await db.update(logs)
//       .set({
//         userId: data.userId,
//         date: data.date,
//         task: data.task,
//         wordCount: data.wordCount
//       })
//       .where(eq(logs.id, id))
//       .returning();
//     return updated;
//   }

//   async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
//     if (data.password) {
//       data.password = await hashPassword(data.password);
//     } else {
//       delete data.password;
//     }
//     await db.update(users)
//       .set(data)
//       .where(eq(users.id, id));
//     return this.getUser(id);
//   }
// }

export interface IStorage {
  initDefaultAdmin(): Promise<void>;
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
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
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

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    if (data.password) {
      data.password = await this.hashPassword(data.password);
    } else {
      delete data.password;
    }
    await db.update(users)
      .set(data)
      .where(eq(users.id, id));
    return this.getUser(id);
  }

  async initDefaultAdmin() {
    const adminUser = await db.query.users.findFirst({
      where: eq(users.username, "edtech.arsh@gmail.com")
    });

    if (!adminUser) {
      await db.insert(users).values({
        username: "edtech.arsh@gmail.com",
        password: await this.hashPassword("arsh@123?"),
        fullName: "Admin",
        isAdmin: true
      });
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
  }
}

// export const storage = new DatabaseStorage();
// storage.initDefaultAdmin = initDefaultAdmin;
// export { initDefaultAdmin };

export const storage = new DatabaseStorage();
storage.initDefaultAdmin(); // ✅ No more TypeScript error
