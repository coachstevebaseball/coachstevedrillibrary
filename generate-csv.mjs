import { createConnection } from 'mysql2/promise';
import fs from 'fs';

const url = process.env.DATABASE_URL;
const m = url.match(/mysql2?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
const conn = await createConnection({
  host: m[3], port: +m[4], user: m[1], password: m[2], database: m[5],
  ssl: { rejectUnauthorized: false }
});

const [drills] = await conn.execute(`
  SELECT d.drillId, d.name, d.difficulty, d.categories, d.duration, d.url, d.isHidden, d.source,
         dd.skillSet, dd.goal, dd.description, dd.equipment,
         (SELECT COUNT(*) FROM drillVideos dv WHERE dv.drillId = d.drillId) as videoCount
  FROM drills d
  LEFT JOIN drillDetails dd ON d.drillId = dd.drillId
  ORDER BY d.name
`);

// CSV header
const headers = ['drillId','name','difficulty','category','duration','url','isHidden','source','skillSet','goal','description','equipment','videoCount'];
const escape = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
};

const rows = drills.map(d => {
  let cat;
  try { cat = JSON.parse(d.categories || '[]')[0]; } catch { cat = d.categories; }
  return [
    d.drillId, d.name, d.difficulty || '', cat || '', d.duration || '',
    d.url || '', d.isHidden ? 'YES' : '', d.source || '',
    d.skillSet || '', (d.goal || '').slice(0, 200), (d.description || '').slice(0, 200),
    d.equipment || '', d.videoCount
  ].map(escape).join(',');
});

const csv = [headers.join(','), ...rows].join('\n');
fs.writeFileSync('/home/ubuntu/usab-drills-directory/post-merge-drills.csv', csv);
console.log(`✓ Generated CSV with ${drills.length} rows → post-merge-drills.csv`);

await conn.end();
