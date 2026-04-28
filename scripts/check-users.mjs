import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log("\n=== USERS TABLE ===");
const [users] = await conn.execute(
  "SELECT id, openId, name, email, loginMethod, role, isActiveClient, lastSignedIn, createdAt FROM users ORDER BY id"
);
console.table(users);

console.log("\n=== INVITES TABLE ===");
const [invites] = await conn.execute(
  "SELECT id, email, role, status, createdAt FROM invites ORDER BY id"
);
console.table(invites);

console.log("\n=== DISTINCT LOGIN METHODS ===");
const [methods] = await conn.execute(
  "SELECT loginMethod, COUNT(*) as count FROM users GROUP BY loginMethod"
);
console.table(methods);

console.log("\n=== USERS WHO HAVE LOGGED IN (lastSignedIn != createdAt) ===");
const [loggedIn] = await conn.execute(
  "SELECT id, name, email, loginMethod, lastSignedIn, createdAt FROM users WHERE lastSignedIn > DATE_ADD(createdAt, INTERVAL 1 MINUTE)"
);
console.table(loggedIn);

console.log("\n=== TOTAL USERS ===", users.length);
console.log("=== TOTAL INVITES ===", invites.length);

await conn.end();
