import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '/home/ubuntu/usab-drills-directory/.env' });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 1. Status distribution
console.log("=== DRILL ASSIGNMENTS STATUS DISTRIBUTION ===");
const [statusDist] = await conn.execute(`
  SELECT status, COUNT(*) as count
  FROM drillAssignments
  GROUP BY status
  ORDER BY count DESC
`);
console.table(statusDist);

// 2. Completed assignments with details
console.log("\n=== COMPLETED ASSIGNMENTS ===");
const [completed] = await conn.execute(`
  SELECT da.id, da.userId, da.drillId, da.drillName, da.status, da.completedAt, da.notes, da.assignedAt
  FROM drillAssignments da
  WHERE da.status = 'completed'
  ORDER BY da.completedAt DESC
  LIMIT 20
`);
console.table(completed);
console.log(`Total completed: ${completed.length}`);

// 3. In-progress assignments
console.log("\n=== IN-PROGRESS ASSIGNMENTS ===");
const [inProgress] = await conn.execute(`
  SELECT da.id, da.userId, da.drillId, da.drillName, da.status, da.assignedAt
  FROM drillAssignments da
  WHERE da.status = 'in-progress'
  ORDER BY da.assignedAt DESC
  LIMIT 20
`);
console.table(inProgress);
console.log(`Total in-progress: ${inProgress.length}`);

// 4. Assignments per user
console.log("\n=== ASSIGNMENTS PER USER ===");
const [perUser] = await conn.execute(`
  SELECT da.userId, u.name, u.role,
    COUNT(*) as total_assignments,
    SUM(CASE WHEN da.status = 'assigned' THEN 1 ELSE 0 END) as assigned,
    SUM(CASE WHEN da.status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
    SUM(CASE WHEN da.status = 'completed' THEN 1 ELSE 0 END) as completed
  FROM drillAssignments da
  LEFT JOIN users u ON da.userId = u.id
  GROUP BY da.userId, u.name, u.role
  ORDER BY total_assignments DESC
`);
console.table(perUser);

// 5. assignmentProgress table check
console.log("\n=== ASSIGNMENT PROGRESS TABLE ===");
const [progressCount] = await conn.execute(`
  SELECT COUNT(*) as total FROM assignmentProgress
`);
console.log(`Total rows in assignmentProgress: ${progressCount[0].total}`);

// 6. Check if any assignment has completedAt set
console.log("\n=== ASSIGNMENTS WITH completedAt SET ===");
const [withCompletedAt] = await conn.execute(`
  SELECT COUNT(*) as count FROM drillAssignments WHERE completedAt IS NOT NULL
`);
console.log(`Assignments with completedAt timestamp: ${withCompletedAt[0].count}`);

// 7. Check for any assignments with notes
console.log("\n=== ASSIGNMENTS WITH NOTES ===");
const [withNotes] = await conn.execute(`
  SELECT id, userId, drillName, status, notes
  FROM drillAssignments
  WHERE notes IS NOT NULL AND notes != ''
  LIMIT 10
`);
console.table(withNotes);
console.log(`Assignments with notes: ${withNotes.length}`);

await conn.end();
