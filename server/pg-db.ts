import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { players, tiers, admins, dbSettings } from '../shared/schema.js';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { comparePasswords, hashPassword } from './password-utils.js';

const { Pool } = pg;

// Default database configuration
const DEFAULT_DB_CONFIG = {
  host: 'luckperms-stolensmp.i.aivencloud.com',
  port: 18708,
  user: 'avnadmin',
  password: 'AVNS_0AM3U5wjshtzuJllI1-',
  database: 'defaultdb',
  ssl: {
    rejectUnauthorized: false // Required for some cloud PostgreSQL servers
  },
  // Connection timeouts
  connectionTimeoutMillis: 15000, // 15 second timeout
  idleTimeoutMillis: 30000, // 30 seconds before idle connections are closed
  max: 10 // Maximum number of clients in the pool
};

// Create a PostgreSQL connection pool with default settings
export let pool = new Pool(DEFAULT_DB_CONFIG);

export let db = drizzle(pool);

// Database connection settings type
type DatabaseConnectionConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
  name?: string;
  isActive?: boolean;
};

// Function to update database connection settings
export async function updateDatabaseConnection(configInput: DatabaseConnectionConfig | null = null) {
  try {
    // Local variable to store the resolved configuration
    let config: DatabaseConnectionConfig | null = configInput;
    let originalPool = pool;
    
    // If no config is provided, try to get the active configuration from the database
    if (!config) {
      try {
        // Create a temporary client to query the database settings
        const client = await pool.connect();
        try {
          // Try to get active config from the database using raw query
          const result = await client.query(`
            SELECT * FROM db_settings WHERE is_active = TRUE LIMIT 1
          `);
          
          // If active settings found, use them
          if (result.rows.length > 0) {
            const dbSetting = result.rows[0];
            config = {
              host: dbSetting.host,
              port: Number(dbSetting.port),
              username: dbSetting.username,
              password: dbSetting.password,
              database: dbSetting.database,
              ssl: dbSetting.ssl || false,
              name: dbSetting.name,
              isActive: true
            };
            console.log(`Found active database connection: ${config.name}`);
          } else {
            // Otherwise try to get the most recent settings
            const latestResult = await client.query(`
              SELECT * FROM db_settings ORDER BY updated_at DESC LIMIT 1
            `);
            
            if (latestResult.rows.length > 0) {
              const dbSetting = latestResult.rows[0];
              config = {
                host: dbSetting.host,
                port: Number(dbSetting.port),
                username: dbSetting.username,
                password: dbSetting.password,
                database: dbSetting.database,
                ssl: dbSetting.ssl || false,
                name: dbSetting.name,
                isActive: dbSetting.is_active || false
              };
              console.log(`Found latest database connection: ${config.name}`);
            } else {
              console.log('No database settings found, using defaults');
              return false;
            }
          }
        } finally {
          client.release();
        }
      } catch (error) {
        console.error('Error fetching database settings:', error);
        // If error occurred (like table doesn't exist yet), continue with existing connection
        return false;
      }
    }
    
    // If we still don't have a config, return
    if (!config) {
      console.log('No valid database configuration found, keeping existing connection');
      return false;
    }
    
    // Configure new connection pool with proper error handling
    try {
      console.log(`Attempting to connect to PostgreSQL at ${config.host}:${config.port}/${config.database}`);
      
      // Create new connection pool with updated settings
      const newPool = new Pool({
        host: config.host,
        port: Number(config.port),
        user: config.username, // Note: user, not username (pg library naming)
        password: config.password,
        database: config.database,
        ssl: config.ssl ? {
          rejectUnauthorized: false
        } : false,
        // Add timeout settings for better error handling
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 10
      });
      
      // Test the new connection
      const testClient = await newPool.connect();
      try {
        await testClient.query('SELECT 1');
        console.log(`Successfully connected to database at ${config.host}:${config.port}/${config.database}`);
      } finally {
        testClient.release();
      }
      
      // If we get here, the connection is good
      
      // Close the existing pool safely
      try {
        await originalPool.end();
      } catch (endError) {
        console.warn('Error closing original pool:', endError);
        // Continue despite error
      }
      
      // Update the global pool and db references
      pool = newPool;
      db = drizzle(pool);
      
      console.log(`Database connection updated to ${config.name || `${config.host}:${config.port}/${config.database}`}`);
      return true;
    } catch (connectionError) {
      console.error('Failed to establish new database connection:', connectionError);
      // If the new connection failed, keep the original pool intact
      return false;
    }
  } catch (error) {
    console.error('Error updating database connection:', error);
    return false;
  }
}

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
        combat_title VARCHAR(100) DEFAULT 'Pirate',
        points INTEGER DEFAULT 0,
        bounty VARCHAR(20) DEFAULT '0',
        region VARCHAR(10) DEFAULT 'NA',
        webhook_url TEXT,
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
    
    // Create admins table with enhanced permissions
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        is_super_admin INTEGER DEFAULT 0,
        can_manage_players INTEGER DEFAULT 1,
        can_manage_admins INTEGER DEFAULT 0
      )
    `);
    
    // Check if the enhanced permissions columns exist, add them if they don't
    try {
      // Check if can_manage_tiers column exists
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='admins' AND column_name='can_manage_tiers'
      `);
      
      // If columns don't exist, add them
      if (columnCheck.rows.length === 0) {
        console.log('Adding enhanced permissions columns to admins table');
        await client.query(`
          ALTER TABLE admins 
          ADD COLUMN can_manage_tiers INTEGER DEFAULT 1,
          ADD COLUMN can_delete_data INTEGER DEFAULT 0,
          ADD COLUMN can_view_admins INTEGER DEFAULT 0,
          ADD COLUMN can_manage_database INTEGER DEFAULT 0,
          ADD COLUMN can_change_settings INTEGER DEFAULT 0
        `);
      }
    } catch (error) {
      console.error('Error checking/adding admin permission columns:', error);
    }
    
    // Create database settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS db_settings (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        host VARCHAR(255) NOT NULL,
        port INTEGER NOT NULL,
        username VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        database VARCHAR(100) NOT NULL,
        ssl BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indices
    await client.query(`CREATE INDEX IF NOT EXISTS player_idx ON tiers (player_id)`);
    
    console.log('Database tables created successfully');
    
    // Add default connection settings to the database
    const defaultSettingsExist = await client.query(`
      SELECT id FROM db_settings WHERE name = 'Default Aiven Cloud Connection' LIMIT 1
    `);
    
    if (defaultSettingsExist.rows.length === 0) {
      await client.query(`
        INSERT INTO db_settings 
        (name, host, port, username, password, database, ssl, is_active)
        VALUES (
          'Default Aiven Cloud Connection',
          'luckperms-stolensmp.i.aivencloud.com',
          18708,
          'avnadmin',
          'AVNS_0AM3U5wjshtzuJllI1-',
          'defaultdb',
          TRUE,
          TRUE
        )
      `);
      console.log('Default database connection settings added');
    }
    
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
    // First check if the admins table has the required permissions columns
    try {
      // Use raw query to check for columns to avoid ORM issues
      const client = await pool.connect();
      try {
        // Check for column existence
        const columnCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name='admins' AND column_name='can_manage_tiers'
        `);
        
        // Add columns if they don't exist
        if (columnCheck.rows.length === 0) {
          console.log('Adding enhanced permissions columns to admins table before seeding');
          await client.query(`
            ALTER TABLE admins 
            ADD COLUMN can_manage_tiers INTEGER DEFAULT 1,
            ADD COLUMN can_delete_data INTEGER DEFAULT 0,
            ADD COLUMN can_view_admins INTEGER DEFAULT 0,
            ADD COLUMN can_manage_database INTEGER DEFAULT 0,
            ADD COLUMN can_change_settings INTEGER DEFAULT 0
          `);
        }
      } finally {
        client.release();
      }
    } catch (columnError) {
      console.error('Error checking/adding admin permission columns:', columnError);
      // Continue with basic seeding even if column check fails
    }
    
    // Now proceed with checking if admin exists and creating if needed
    try {
      // Check if lucifer admin exists using raw query
      const client = await pool.connect();
      try {
        const existingAdmin = await client.query(`
          SELECT * FROM admins WHERE username = $1 LIMIT 1
        `, ['lucifer']);
        
        if (existingAdmin.rows.length === 0) {
          // Create lucifer admin with super admin privileges
          const hashedPassword = await hashPassword('mephist');
          
          // Insert with only base fields that are guaranteed to exist
          await client.query(`
            INSERT INTO admins (
              username, password, is_super_admin, can_manage_players, can_manage_admins
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            'lucifer',
            hashedPassword,
            1, // Super admin
            1, // Can manage players
            1  // Can manage admins
          ]);
          
          // Try to update with enhanced permissions
          try {
            await client.query(`
              UPDATE admins SET
                can_manage_tiers = 1,
                can_delete_data = 1,
                can_view_admins = 1,
                can_manage_database = 1,
                can_change_settings = 1
              WHERE username = $1
            `, ['lucifer']);
          } catch (enhancedError: any) {
            console.warn('Could not set enhanced permissions, they may not exist yet:', enhancedError?.message || 'Unknown error');
          }
          
          console.log('Lucifer admin account created');
        } else {
          // Admin exists, try to update permissions if needed
          try {
            await client.query(`
              UPDATE admins SET
                is_super_admin = 1,
                can_manage_players = 1,
                can_manage_admins = 1,
                can_manage_tiers = 1,
                can_delete_data = 1,
                can_view_admins = 1,
                can_manage_database = 1,
                can_change_settings = 1
              WHERE username = $1
            `, ['lucifer']);
            console.log('Lucifer admin permissions updated');
          } catch (updateError: any) {
            console.warn('Could not update all permissions, some may not exist yet:', updateError?.message || 'Unknown error');
          }
        }
      } finally {
        client.release();
      }
    } catch (adminError: any) {
      console.error('Error with admin creation/update:', adminError?.message || 'Unknown error');
    }
    
    return true;
  } catch (error) {
    console.error('Error seeding default admin:', error);
    // Don't throw, as we want to continue even if seeding fails
    return false;
  }
}