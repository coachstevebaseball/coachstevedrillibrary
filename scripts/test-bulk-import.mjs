/**
 * Acceptance test for bulk import with rich coaching fields.
 * Calls the tRPC bulkUpsert mutation directly via HTTP.
 */
import http from 'http';

const TEST_DRILL = {
  drillId: "bulk-import-test-drill",
  name: "Bulk Import Test Drill",
  difficulty: "Medium",
  duration: "10m",
  categories: ["Hitting"],
  drillType: "Tee Work",
  problems: ["Timing Issues"],
  outcomes: ["Improve Timing"],
  tags: ["test"],
  goalOfDrill: "Verify bulk import accepts all rich content fields.",
  shortDescription: "Test drill confirming end-to-end bulk import functionality.",
  coachStevesCue: "Import once, render everywhere",
  watchFor: "All eight rich content fields appear on the public page.",
  whatToFeel: ["field one populated", "field two populated"],
  problemItSolves: ["Manual entry bottleneck", "Field mapping mismatches"],
  howToDoIt: ["Paste JSON", "Click Parse & Preview", "Click Import", "Verify on public page"],
  commonMistakes: ["Forgetting required drillId", "Mismatched field aliases"],
  visible: true
};

// tRPC batch call format
const body = JSON.stringify({
  "0": {
    json: { rows: [TEST_DRILL] }
  }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/trpc/drillsDirectory.bulkUpsert?batch=1',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // We need an admin cookie - let's try without first to see the error
    'Cookie': ''
  }
};

// First, let's check if we can get a session cookie from the dev environment
async function makeRequest(cookieHeader) {
  return new Promise((resolve, reject) => {
    const opts = { ...options };
    if (cookieHeader) opts.headers.Cookie = cookieHeader;
    
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Testing bulk import endpoint...');
  const result = await makeRequest('');
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.body, null, 2));
  
  if (result.status === 401 || (result.body && JSON.stringify(result.body).includes('login'))) {
    console.log('\n⚠️  Need admin authentication. Will use SQL to insert test drill directly and verify schema works.');
  }
}

main().catch(console.error);
