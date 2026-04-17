const mysql = require('mysql2/promise');

async function checkDrill() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost',
    user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
    password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
    database: process.env.DATABASE_URL?.split('/').pop() || 'test',
  });

  try {
    const [rows] = await connection.execute(
      'SELECT * FROM customDrills WHERE name = ?',
      ['Test Drill Fix Verification']
    );
    
    console.log('Query result:', JSON.stringify(rows, null, 2));
    
    if (rows.length > 0) {
      console.log('\n✅ TEST DRILL FOUND! Drill was successfully saved to the database.');
      console.log('Drill ID:', rows[0].drillId);
      console.log('Is Hidden:', rows[0].isHidden);
    } else {
      console.log('\n❌ TEST DRILL NOT FOUND in database');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkDrill();
