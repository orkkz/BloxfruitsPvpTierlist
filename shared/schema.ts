import { pgTable, text, serial, integer, varchar, timestamp, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Player table
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  robloxId: varchar("roblox_id", { length: 50 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull(),
  avatarUrl: text("avatar_url").notNull(),
  combatTitle: varchar("combat_title", { length: 100 }).default("Pirate"),
  points: integer("points").default(0),
  bounty: varchar("bounty", { length: 20 }).default("0"),
  region: varchar("region", { length: 10 }).default("NA"),
  webhookUrl: text("webhook_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tiers table - stores player rankings in different categories
export const tiers = pgTable("tiers", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  category: varchar("category", { length: 20 }).notNull(), // melee, fruit, sword, gun
  tier: varchar("tier", { length: 5 }).notNull(), // SS, S, A, B, C, D, E
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  uniquePlayerCategory: unique().on(t.playerId, t.category),
  playerIdx: index("player_idx").on(t.playerId),
}));

// Admin users for authentication
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isSuperAdmin: integer("is_super_admin").default(0),
  canManagePlayers: integer("can_manage_players").default(1),
  canManageAdmins: integer("can_manage_admins").default(0),
});

// Insert schemas
export const insertPlayerSchema = createInsertSchema(players)
  .omit({ id: true, createdAt: true })
  .extend({
    // Add validation for webhookUrl to ensure it's a valid Discord webhook URL or empty
    webhookUrl: z.string()
      .refine(
        (val) => !val || val.startsWith('https://discord.com/api/webhooks/'), 
        { message: 'If provided, webhook URL must be a valid Discord webhook URL' }
      )
      .optional()
      .nullable(),
  });
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

export const categoryEnum = z.enum(["overall", "melee", "fruit", "sword", "gun", "bounty"]);
export type Category = z.infer<typeof categoryEnum>;

export const tierEnum = z.enum(["SS", "S", "A", "B", "C", "D", "E"]);
export type TierGrade = z.infer<typeof tierEnum>;

// Zod schema for validating bounty values with K/M suffixes
export const bountySchema = z.string().refine(
  (val) => {
    // Allow formats like 30M, 321K, 500, etc.
    return /^\d+(\.\d+)?[KMB]?$/i.test(val);
  },
  {
    message: "Bounty must be a number with optional K, M, or B suffix (e.g., 30M, 321K)",
  }
);

// Combat title mappings (old to new)
export const COMBAT_TITLE_MAPPING = {
  "Rookie": "Pirate",
  "Rising Star": "Sea Prodigy",
  "Legendary Pirate": "Warlord of the Sea", 
  "Grand Master": "Emperor of the Sea",
  "Combat Master": "King of the Pirates"
};

// Admin schema with permissions
export const adminWithPermissionsSchema = z.object({
  id: z.number(),
  username: z.string(),
  isSuperAdmin: z.number(),
  canManagePlayers: z.number(),
  canManageAdmins: z.number(),
});

export type AdminWithPermissions = z.infer<typeof adminWithPermissionsSchema>;

// New admin schema
export const newAdminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  canManagePlayers: z.number().default(1),
  canManageAdmins: z.number().default(0),
  isSuperAdmin: z.number().default(0),
});

export type NewAdmin = z.infer<typeof newAdminSchema>;
