import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../shared/schema.js';
import { comparePasswords, hashPassword } from './password-utils.js';

// SQLite database file path
const DB_PATH = './data/bloxfruits_pvp.db';

// Create SQLite database connection
export let db = initSqliteDb();

function initSqliteDb() {
  try {
    const sqlite = new Database(DB_PATH);
    
    // Enable foreign keys in SQLite
    sqlite.pragma('foreign_keys = ON');
    
    return drizzle(sqlite);
  } catch (error) {
    console.error('Error initializing SQLite database:', error);
    throw error;
  }
}

// Test database connection
export async function testConnection() {
  try {
    // SQLite connection is synchronous and established on init
    console.log('Successfully connected to SQLite database');
    return true;
  } catch (error) {
    console.error('Error connecting to SQLite:', error);
    return false;
  }
}

// Initialize database tables if they don't exist
export async function initDatabase() {
  try {
    const sqlite = new Database(DB_PATH);
    
    // Enable foreign keys in SQLite
    sqlite.pragma('foreign_keys = ON');
    
    // Create players table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roblox_id TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL,
        avatar_url TEXT NOT NULL,
        combat_title TEXT DEFAULT 'Pirate',
        points INTEGER DEFAULT 0,
        bounty TEXT DEFAULT '0',
        region TEXT DEFAULT 'NA',
        webhook_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create tiers table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS tiers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        tier TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(player_id, category),
        FOREIGN KEY(player_id) REFERENCES players(id) ON DELETE CASCADE
      )
    `);
    
    // Create admins table with enhanced permissions
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        is_super_admin INTEGER DEFAULT 0,
        can_manage_players INTEGER DEFAULT 1,
        can_manage_admins INTEGER DEFAULT 0,
        can_manage_tiers INTEGER DEFAULT 1,
        can_delete_data INTEGER DEFAULT 0,
        can_view_admins INTEGER DEFAULT 0,
        can_manage_database INTEGER DEFAULT 0,
        can_change_settings INTEGER DEFAULT 0
      )
    `);
    
    // Create database settings table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS db_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        host TEXT NOT NULL,
        port INTEGER NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        database TEXT NOT NULL,
        ssl INTEGER DEFAULT 1,
        is_active INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indices
    sqlite.exec(`CREATE INDEX IF NOT EXISTS player_idx ON tiers (player_id)`);
    
    console.log('SQLite database tables created successfully');
    
    // Add default connection settings to the database
    const defaultSettingsExist = sqlite.prepare(
      `SELECT id FROM db_settings WHERE name = 'SQLite Local Database' LIMIT 1`
    ).get();
    
    if (!defaultSettingsExist) {
      sqlite.prepare(`
        INSERT INTO db_settings 
        (name, host, port, username, password, database, ssl, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'SQLite Local Database',
        'localhost',
        0,
        'sqlite',
        '',
        DB_PATH,
        0,
        1
      );
      console.log('Default SQLite database connection settings added');
    }
    
    sqlite.close();
    
    return true;
  } catch (error) {
    console.error('Error initializing SQLite database:', error);
    throw error;
  }
}

// Seed a default admin user if one doesn't exist
export async function seedDefaultAdmin() {
  try {
    const sqlite = new Database(DB_PATH);
    
    // Check if lucifer admin exists
    const existingAdmin = sqlite.prepare(
      `SELECT * FROM admins WHERE username = ? LIMIT 1`
    ).get('lucifer');
    
    if (!existingAdmin) {
      // Create lucifer admin with super admin privileges
      const hashedPassword = await hashPassword('mephist');
      
      sqlite.prepare(`
        INSERT INTO admins (
          username, password, is_super_admin, can_manage_players, can_manage_admins,
          can_manage_tiers, can_delete_data, can_view_admins, can_manage_database, can_change_settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'lucifer',
        hashedPassword,
        1, // Super admin
        1, // Can manage players
        1, // Can manage admins
        1, // Can manage tiers
        1, // Can delete data
        1, // Can view admins
        1, // Can manage database
        1  // Can change settings
      );
      
      console.log('Lucifer admin account created');
    } else {
      // Admin exists, update permissions if needed
      sqlite.prepare(`
        UPDATE admins SET
          is_super_admin = 1,
          can_manage_players = 1,
          can_manage_admins = 1,
          can_manage_tiers = 1,
          can_delete_data = 1,
          can_view_admins = 1,
          can_manage_database = 1,
          can_change_settings = 1
        WHERE username = ?
      `).run('lucifer');
      
      console.log('Lucifer admin permissions updated');
    }
    
    // Create restricted admin user - now await it
    await createRestrictedAdmin(sqlite);
    
    sqlite.close();
    
    return true;
  } catch (error) {
    console.error('Error seeding default admin:', error);
    // Don't throw, as we want to continue even if seeding fails
    return false;
  }
}

// Create a restricted admin with specific permissions
async function createRestrictedAdmin(sqlite: Database.Database) {
  try {
    // Check if the restricted admin already exists
    const existingAdmin = sqlite.prepare(
      `SELECT * FROM admins WHERE username = ? LIMIT 1`
    ).get('bloxfruit_tester08');
    
    if (!existingAdmin) {
      // Create the restricted admin - IMPORTANT: await the password hashing
      const hashedPassword = await hashPassword('yourabloxfruitspvptester');
      
      sqlite.prepare(`
        INSERT INTO admins (
          username, password, is_super_admin, can_manage_players, can_manage_admins,
          can_manage_tiers, can_delete_data, can_view_admins, can_manage_database, can_change_settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'bloxfruit_tester08',
        hashedPassword,
        0, // Not a super admin
        1, // Can manage players
        0, // Cannot manage admins
        1, // Can manage tiers
        0, // Cannot delete data
        0, // Cannot view admin list
        0, // Cannot manage database
        0  // Cannot change settings
      );
      
      console.log('Restricted admin account created: bloxfruit_tester08');
    } else {
      // Update the existing restricted admin's permissions
      sqlite.prepare(`
        UPDATE admins SET
          is_super_admin = 0,
          can_manage_players = 1,
          can_manage_admins = 0,
          can_manage_tiers = 1,
          can_delete_data = 0,
          can_view_admins = 0,
          can_manage_database = 0,
          can_change_settings = 0
        WHERE username = ?
      `).run('bloxfruit_tester08');
      
      console.log('Restricted admin permissions updated: bloxfruit_tester08');
    }
    
    return true;
  } catch (error) {
    console.error('Error creating/updating restricted admin:', error);
    return false;
  }
}