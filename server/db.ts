import mysql from 'mysql2/promise';

// MySQL Connection Pool
export const pool = mysql.createPool({
  host: 'skinrestorer-stolensmp.i.aivencloud.com', 
  port: 18752, // Default MySQL port
  user: 'avnadmin',
  password: 'AVNS_wdLtc3-AnM3vNZs_tf8',
  database: 'bf',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0
});

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

export async function executeQuery<T>(sql: string, params: any[] = []): Promise<T> {
  try {
    const [results] = await pool.execute(sql, params);
    return results as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}