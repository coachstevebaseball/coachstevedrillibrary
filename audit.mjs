import fs from 'fs';

// Check auth context
const context = fs.readFileSync('server/_core/context.ts', 'utf8');
const authLines = context.split('\n').filter(l => 
  l.includes('user') || l.includes('jwt') || l.includes('cookie') || l.includes('session') || l.includes('openId') || l.includes('token')
);
console.log('=== AUTH CONTEXT (key lines) ===');
authLines.forEach(l => console.log('  ' + l.trim()));

// Check env.ts for RESEND
const env = fs.readFileSync('server/_core/env.ts', 'utf8');
const resendLines = env.split('\n').filter(l => l.includes('resend') || l.includes('RESEND'));
console.log('\n=== RESEND ENV CONFIG ===');
resendLines.forEach(l => console.log('  ' + l.trim()));

// Check if RESEND_API_KEY is set
console.log('\nRESEND_API_KEY set?', !!process.env.RESEND_API_KEY);
console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'NOT SET');

// Check all router files for broken imports
const routerFiles = fs.readdirSync('server').filter(f => f.startsWith('routers'));
console.log('\n=== ROUTER FILES ===');
routerFiles.forEach(f => {
  const content = fs.readFileSync('server/' + f, 'utf8');
  const lines = content.split('\n').length;
  const imports = content.split('\n').filter(l => l.startsWith('import ')).length;
  const procedures = (content.match(/protectedProcedure|publicProcedure/g) || []).length;
  console.log(`  ${f}: ${lines} lines, ${imports} imports, ${procedures} procedures`);
});

// Check App.tsx routes
const app = fs.readFileSync('client/src/App.tsx', 'utf8');
const routes = app.split('\n').filter(l => l.includes('Route') && l.includes('path'));
console.log('\n=== REGISTERED ROUTES ===');
routes.forEach(l => console.log('  ' + l.trim()));

// Check all page files
const pages = fs.readdirSync('client/src/pages');
console.log('\n=== PAGE FILES ===');
pages.forEach(p => console.log('  ' + p));
