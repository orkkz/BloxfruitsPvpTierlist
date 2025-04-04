import { pool } from './pg-db.ts';

// This script directly migrates the database tables to add missing columns

async function migrateTables() {
  const client = await pool.connect();
  
  try {
    console.log('Connecting to database...');
    console.log('Connected to database');
    
    console.log('Checking for missing columns in admins table...');
    
    // Check if columns exist
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'admins' 
      AND column_name IN ('is_super_admin', 'can_manage_players', 'can_manage_admins')
    `);
    
    const existingColumns = res.rows.map(row => row.column_name);
    
    // Add missing columns
    if (!existingColumns.includes('is_super_admin')) {
      console.log('Adding is_super_admin column...');
      await client.query(`ALTER TABLE admins ADD COLUMN is_super_admin INTEGER DEFAULT 0`);
    }
    
    if (!existingColumns.includes('can_manage_players')) {
      console.log('Adding can_manage_players column...');
      await client.query(`ALTER TABLE admins ADD COLUMN can_manage_players INTEGER DEFAULT 1`);
    }
    
    if (!existingColumns.includes('can_manage_admins')) {
      console.log('Adding can_manage_admins column...');
      await client.query(`ALTER TABLE admins ADD COLUMN can_manage_admins INTEGER DEFAULT 0`);
    }
    
    // Update existing lucifer admin (if it exists) to have super admin privileges
    console.log('Updating lucifer admin privileges...');
    await client.query(`
      UPDATE admins 
      SET is_super_admin = 1, can_manage_players = 1, can_manage_admins = 1 
      WHERE username = 'lucifer'
    `);
    
    console.log('Migration completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrateTables();