import mysql from "mysql2/promise";

let pool;

export function getDatabase() {
  if (pool) return pool;

  const { DB_HOST, DB_PORT = "3306", DB_NAME, DB_USER, DB_PASSWORD } = process.env;
  if (!DB_HOST || !DB_NAME || !DB_USER || !DB_PASSWORD) {
    throw new Error("Database environment variables are not configured.");
  }

  pool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 5,
    enableKeepAlive: true,
  });
  return pool;
}
