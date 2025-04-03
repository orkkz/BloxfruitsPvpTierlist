import { pgTable, text, serial, integer, varchar, timestamp, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Player table
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  robloxId: varchar("roblox_id", { length: 50 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull(),
  avatarUrl: text("avatar_url").notNull(),
  combatTitle: varchar("combat_title", { length: 100 }).default("Rookie"),
  points: integer("points").default(0),
  region: varchar("region", { length: 10 }).default("NA"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tiers table - stores player rankings in different categories
export const tiers = pgTable("tiers", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 20 }).notNull(), // melee, fruit, sword, gun
  tier: varchar("tier", { length: 5 }).notNull(), // SS, S, A, B, C, D, E
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  uniquePlayerCategory: unique().on(t.playerId, t.category)
}));

// Admin users for authentication
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
});

// Insert schemas
export const insertPlayerSchema = createInsertSchema(players).omit({ id: true, createdAt: true });
export const insertTierSchema = createInsertSchema(tiers).omit({ id: true, updatedAt: true });
export const insertAdminSchema = createInsertSchema(admins).omit({ id: true });

// Types
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Tier = typeof tiers.$inferSelect;
export type InsertTier = z.infer<typeof insertTierSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

// Extended schemas for API
export const playerWithTiersSchema = z.object({
  player: z.object(insertPlayerSchema.shape).extend({
    id: z.number(),
  }),
  tiers: z.array(z.object(insertTierSchema.shape).extend({
    id: z.number(),
  })),
});

export type PlayerWithTiers = z.infer<typeof playerWithTiersSchema>;

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

export const categoryEnum = z.enum(["overall", "melee", "fruit", "sword", "gun"]);
export type Category = z.infer<typeof categoryEnum>;

export const tierEnum = z.enum(["SS", "S", "A", "B", "C", "D", "E"]);
export type TierGrade = z.infer<typeof tierEnum>;
