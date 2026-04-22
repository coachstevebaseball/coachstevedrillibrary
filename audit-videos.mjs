import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 1. Non-hitting drill videos sample
const [nonHitVids] = await conn.query(`
  SELECT dv.drillId, dv.videoUrl, d.categories
  FROM drillVideos dv
  LEFT JOIN drills d ON d.drillId = dv.drillId
  WHERE d.categories IS NOT NULL 
  AND NOT JSON_CONTAINS(d.categories, '"Hitting"')
  LIMIT 15
`);
console.log('=== Non-hitting drill videos (sample 15) ===');
nonHitVids.forEach(v => console.log(v.drillId, '|', String(v.videoUrl).substring(0, 80), '|', v.categories));

// 2. Count total non-hitting videos
const [countResult] = await conn.query(`
  SELECT COUNT(*) as cnt FROM drillVideos dv
  LEFT JOIN drills d ON d.drillId = dv.drillId
  WHERE d.categories IS NOT NULL 
  AND NOT JSON_CONTAINS(d.categories, '"Hitting"')
`);
console.log('\nTotal non-hitting drill videos:', countResult[0].cnt);

// 3. Video URL breakdown
const [allVids] = await conn.query('SELECT drillId, videoUrl FROM drillVideos');
let broken = 0, youtube = 0, vimeo = 0, other = 0;
for (const v of allVids) {
  const url = v.videoUrl || '';
  if (url.trim() === '') { broken++; }
  else if (url.includes('youtube') || url.includes('youtu.be')) { youtube++; }
  else if (url.includes('vimeo')) { vimeo++; }
  else { other++; }
}
console.log('\n=== Video URL breakdown ===');
console.log('YouTube:', youtube, '| Vimeo:', vimeo, '| Other:', other, '| Broken/empty:', broken);

// 4. Check the videos.getVideo procedure - what table does it query?
// Also check if drills that show "Drill not found" have entries in drillVideos
const testSlugs = ['1st-base-off-bag', '1st-base-inside-receiving', '43-drill', 'double-ball-toss'];
console.log('\n=== Test slug lookups ===');
for (const slug of testSlugs) {
  const [drillRow] = await conn.query('SELECT id, drillId, name, categories FROM drills WHERE drillId = ?', [slug]);
  const [videoRow] = await conn.query('SELECT drillId, videoUrl FROM drillVideos WHERE drillId = ?', [slug]);
  const [detailRow] = await conn.query('SELECT drillId, goal FROM drillDetails WHERE drillId = ?', [slug]);
  console.log(`\n${slug}:`);
  console.log('  drills table:', drillRow.length > 0 ? `FOUND (id=${drillRow[0].id}, cat=${drillRow[0].categories})` : 'MISSING');
  console.log('  drillVideos:', videoRow.length > 0 ? `FOUND (url=${String(videoRow[0].videoUrl).substring(0, 60)})` : 'MISSING');
  console.log('  drillDetails:', detailRow.length > 0 ? `FOUND (goal=${String(detailRow[0].goal).substring(0, 60)})` : 'MISSING');
}

// 5. Check how many drills in drills table have NO matching drillVideos entry
const [noVideo] = await conn.query(`
  SELECT COUNT(*) as cnt FROM drills d
  LEFT JOIN drillVideos dv ON d.drillId = dv.drillId
  WHERE dv.drillId IS NULL AND d.isVisible = 1
`);
console.log('\n=== Drills with NO video entry ===');
console.log('Visible drills without video:', noVideo[0].cnt);

await conn.end();
