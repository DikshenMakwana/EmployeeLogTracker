import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  fullName: text("full_name").notNull(),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  date: timestamp("date").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    fullName: true,
    isAdmin: true,
  })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    fullName: z.string().min(2, "Full name is required"),
  });

export const insertLogSchema = createInsertSchema(logs)
  .pick({
    userId: true,
    date: true,
    content: true,
  })
  .extend({
    content: z.string().min(1, "Log content is required"),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;
