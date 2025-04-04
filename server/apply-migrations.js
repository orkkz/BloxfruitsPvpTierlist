import { pool, db } from './pg-db.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// This script runs the database migrations manually

const __dirname = dirname(fileURLToPath(import.meta.url));

async function applyMigrations() {
  // Log database connection
  console.log('Connecting to database...');
  
  try {
    const client = await pool.connect();
    console.log('Connected to database');
    client.release();
    
    console.log('Applying database migrations...');
    // Apply migrations from the migrations folder
    await migrate(db, { migrationsFolder: join(__dirname, '../drizzle') });
    console.log('Migrations applied successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  }
}

applyMigrations();