import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { players, tiers, admins } from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { comparePasswords, hashPassword } from './password-utils.js';

const { Pool } = pg;

// Create a PostgreSQL connection pool
export const pool = new Pool({
  host: 'luckperms-stolensmp.i.aivencloud.com',
  port: 18708,
  user: 'avnadmin',
  password: 'AVNS_0AM3U5wjshtzuJllI1-',
  database: 'defaultdb',
  ssl: {
    rejectUnauthorized: false // Required for some cloud PostgreSQL servers
  }
});

export const db = drizzle(pool);

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');
    client.release();
    return true;
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    return false;
  }
}

// Initialize database tables if they don't exist
export async function initDatabase() {
  const client = await pool.connect();
  
  try {
    // Create tables using plain SQL as we're initializing the database
    // This will handle the case where tables don't exist yet
    
    // Create players table
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        roblox_id VARCHAR(50) NOT NULL UNIQUE,
        username VARCHAR(100) NOT NULL,
        avatar_url TEXT NOT NULL,
        combat_title VARCHAR(100) DEFAULT 'Rookie',
        points INTEGER DEFAULT 0,
        bounty VARCHAR(20) DEFAULT '0',
        region VARCHAR(10) DEFAULT 'NA',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create tiers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tiers (
        id SERIAL PRIMARY KEY,
        player_id INTEGER NOT NULL,
        category VARCHAR(20) NOT NULL,
        tier VARCHAR(5) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(player_id, category)
      )
    `);
    
    // Create admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `);
    
    // Create indices
    await client.query(`CREATE INDEX IF NOT EXISTS player_idx ON tiers (player_id)`);
    
    console.log('Database tables created successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Seed a default admin user if one doesn't exist
export async function seedDefaultAdmin() {
  try {
    // Check if any admin exists
    const adminExists = await db.select()
      .from(admins)
      .limit(1);
    
    if (adminExists.length === 0) {
      // Create default admin
      const hashedPassword = await hashPassword('adminpassword');
      
      await db.insert(admins)
        .values({
          username: 'admin',
          password: hashedPassword
        });
      
      console.log('Default admin user created');
    }
    
    return true;
  } catch (error) {
    console.error('Error seeding default admin:', error);
    throw error;
  }
}