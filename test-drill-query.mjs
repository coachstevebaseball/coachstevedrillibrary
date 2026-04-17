import { getDb } from './server/db.ts';

async function testQuery() {
  const db = await getDb();
  if (!db) {
    console.log('Database not available');
    process.exit(1);
  }

  try {
    const { customDrills } = await import('./drizzle/schema.ts');
    const { eq } = await import('drizzle-orm');
    
    // Query for our test drill
    const result = await db.select().from(customDrills).where(eq(customDrills.name, 'Test Drill Fix Verification'));
    
    console.log('Query result:', JSON.stringify(result, null, 2));
    
    if (result.length > 0) {
      console.log('\n✅ TEST DRILL FOUND! Drill was successfully saved to the database.');
      console.log('Drill ID:', result[0].drillId);
      console.log('Is Hidden:', result[0].isHidden);
    } else {
      console.log('\n❌ TEST DRILL NOT FOUND in database');
    }
  } catch (error) {
    console.error('Error querying database:', error);
  }
  
  process.exit(0);
}

testQuery();
