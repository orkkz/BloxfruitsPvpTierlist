import { pgTable, text, serial, integer, varchar, timestamp, unique, index, boolean } from "drizzle-orm/pg-core";
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

// Database connection settings
export const dbSettings = pgTable("db_settings", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  host: varchar("host", { length: 255 }).notNull(),
  port: integer("port").notNull(),
  username: varchar("username", { length: 100 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  database: varchar("database", { length: 100 }).notNull(),
  ssl: boolean("ssl").default(true),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin users for authentication
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isSuperAdmin: integer("is_super_admin").default(0),
  canManagePlayers: integer("can_manage_players").default(1),
  canManageAdmins: integer("can_manage_admins").default(0),
  // Enhanced permissions
  canManageTiers: integer("can_manage_tiers").default(1),
  canDeleteData: integer("can_delete_data").default(0),
  canViewAdmins: integer("can_view_admins").default(0),
  canManageDatabase: integer("can_manage_database").default(0),
  canChangeSettings: integer("can_change_settings").default(0),
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
export const insertDbSettingsSchema = createInsertSchema(dbSettings).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Types
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Tier = typeof tiers.$inferSelect;
export type InsertTier = z.infer<typeof insertTierSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type DbSetting = typeof dbSettings.$inferSelect;
export type InsertDbSetting = z.infer<typeof insertDbSettingsSchema>;

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

// Database settings schema
export const databaseSettingsSchema = z.object({
  host: z.string().min(1, "Database host is required"),
  port: z.union([
    z.string().regex(/^\d+$/, "Port must be a number"),
    z.number().int().positive("Port must be a positive integer")
  ]).transform(val => typeof val === 'string' ? parseInt(val, 10) : val),
  username: z.string().min(1, "Database username is required"),
  password: z.string().min(1, "Database password is required"),
  database: z.string().min(1, "Database name is required"),
  ssl: z.boolean().default(true)
});

export type DatabaseSettings = z.infer<typeof databaseSettingsSchema>;

// Enhanced admin permissions schema
export const adminPermissionsSchema = z.object({
  canManagePlayers: z.number().default(0), // Add/edit players
  canManageTiers: z.number().default(0),   // Add/edit tiers
  canDeleteData: z.number().default(0),    // Delete players/tiers
  canViewAdmins: z.number().default(0),    // View admin list
  canManageAdmins: z.number().default(0),  // Add/edit admins
  canManageDatabase: z.number().default(0), // Change DB settings
  canChangeSettings: z.number().default(0), // Change site settings
});

export type AdminPermissions = z.infer<typeof adminPermissionsSchema>;

// Admin schema with permissions
export const adminWithPermissionsSchema = z.object({
  id: z.number(),
  username: z.string(),
  isSuperAdmin: z.number(),
  canManagePlayers: z.number(),
  canManageAdmins: z.number(),
  permissions: adminPermissionsSchema.optional(),
});

export type AdminWithPermissions = z.infer<typeof adminWithPermissionsSchema>;

// New admin schema with enhanced permissions
export const newAdminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  canManagePlayers: z.number().default(1),
  canManageAdmins: z.number().default(0),
  isSuperAdmin: z.number().default(0),
  permissions: adminPermissionsSchema.optional(),
});

export type NewAdmin = z.infer<typeof newAdminSchema>;
