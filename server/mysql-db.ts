import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { players, tiers, admins } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

// MySQL Connection Pool
export const pool = mysql.createPool({
  host: 'skinrestorer-stolensmp.i.aivencloud.com', 
  port: 18752,
  user: 'avnadmin',
  password: 'AVNS_wdLtc3-AnM3vNZs_tf8',
  database: 'bf',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0
});

export const db = drizzle(pool);

// Test database connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error connecting to MySQL:', error);
    return false;
  }
}

// Initialize database tables if they don't exist
export async function initDatabase() {
  try {
    // Create players table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS players (
        id INT AUTO_INCREMENT PRIMARY KEY,
        roblox_id VARCHAR(50) NOT NULL UNIQUE,
        username VARCHAR(100) NOT NULL,
        avatar_url TEXT NOT NULL,
        combat_title VARCHAR(100) DEFAULT 'Rookie',
        points INT DEFAULT 0,
        bounty VARCHAR(20) DEFAULT '0',
        region VARCHAR(10) DEFAULT 'NA',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tiers table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tiers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        player_id INT NOT NULL,
        category VARCHAR(20) NOT NULL,
        tier VARCHAR(5) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_player_category (player_id, category),
        INDEX player_idx (player_id)
      )
    `);

    // Create admins table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `);

    console.log('Database tables created successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Check if admin exists, if not create default admin
export async function seedDefaultAdmin() {
  try {
    const [admins] = await pool.execute('SELECT * FROM admins WHERE username = ?', ['lucifer']);
    
    if (Array.isArray(admins) && admins.length === 0) {
      // Insert default admin (username: lucifer, password: mephist)
      // In a real application, you would hash the password
      await pool.execute(
        'INSERT INTO admins (username, password) VALUES (?, ?)',
        ['lucifer', 'mephist']
      );
      console.log('Default admin created');
    }
    
    return true;
  } catch (error) {
    console.error('Error seeding default admin:', error);
    return false;
  }
}