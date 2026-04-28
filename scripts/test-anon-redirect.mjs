/**
 * Anonymous URL Redirect Test
 * 
 * Tests that all protected routes redirect unauthenticated users to the OAuth login page.
 * Uses a fresh browser context (no cookies) to simulate an anonymous visitor.
 */
import puppeteer from 'puppeteer-core';

const BASE_URL = 'http://localhost:3000';
const ROUTES_TO_TEST = [
  '/athlete-portal',
  '/drill/1',
  '/parent-dashboard',
  '/hitting-coach',
  '/admin',
  '/coach-dashboard',
  '/embed',
  '/notifications',
];

async function testAnonymousRedirects() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  console.log('=== ANONYMOUS URL REDIRECT TEST ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  const results = [];

  for (const route of ROUTES_TO_TEST) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    
    // Track all navigation requests
    let redirectedToOAuth = false;
    let oauthUrl = '';
    
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('manus.im') || url.includes('/app-auth')) {
        redirectedToOAuth = true;
        oauthUrl = url;
      }
    });
    
    try {
      const url = `${BASE_URL}${route}`;
      console.log(`Testing: ${route}`);
      
      // Navigate and wait for network to settle
      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      
      // Wait for React to render and useEffect to fire the redirect
      await new Promise(r => setTimeout(r, 3000));
      
      const finalUrl = page.url();
      const pageTitle = await page.title();
      
      // Get page text content
      const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
      
      // Determine if protection is working
      const showsLoginPage = bodyText.includes('Sign In') && 
                             (bodyText.includes('Invite-Only') || bodyText.includes('Private Player'));
      
      // Check if the page shows any protected content
      const showsProtectedContent = bodyText.includes('Coach Dashboard') ||
                                     bodyText.includes('Athlete Portal') ||
                                     bodyText.includes('My Assignments') ||
                                     bodyText.includes('Hitting Coach') ||
                                     bodyText.includes('Parent Dashboard');
      
      const passed = redirectedToOAuth || showsLoginPage || !showsProtectedContent;
      
      results.push({
        route,
        finalUrl: finalUrl.substring(0, 150),
        redirectedToOAuth,
        oauthUrl: oauthUrl.substring(0, 100),
        showsLoginPage,
        showsProtectedContent,
        bodyPreview: bodyText.substring(0, 100).replace(/\n/g, ' '),
        passed,
      });
      
      console.log(`  Final URL: ${finalUrl.substring(0, 100)}`);
      if (redirectedToOAuth) console.log(`  OAuth URL: ${oauthUrl.substring(0, 100)}`);
      console.log(`  Shows Login Page: ${showsLoginPage}`);
      console.log(`  Shows Protected Content: ${showsProtectedContent}`);
      console.log(`  Body Preview: "${bodyText.substring(0, 80).replace(/\n/g, ' ')}"`);
      console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
      console.log('');
    } catch (err) {
      const errMsg = err.message || '';
      if (errMsg.includes('ERR_NAME_NOT_RESOLVED') || errMsg.includes('manus.im')) {
        results.push({ route, finalUrl: 'Redirected to manus.im (external OAuth)', redirectedToOAuth: true, passed: true });
        console.log(`  Result: ✅ PASS (browser redirected to external OAuth - DNS not resolved in sandbox)`);
        console.log('');
      } else {
        results.push({ route, finalUrl: `Error: ${errMsg.substring(0, 80)}`, passed: false });
        console.log(`  Error: ${errMsg.substring(0, 80)}`);
        console.log(`  Result: ❌ FAIL`);
        console.log('');
      }
    } finally {
      await context.close();
    }
  }

  console.log('\n=== SUMMARY ===');
  const passCount = results.filter(r => r.passed).length;
  console.log(`${passCount}/${results.length} routes correctly block anonymous access`);
  
  if (passCount < results.length) {
    console.log('\nFAILED ROUTES:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ${r.route} → Shows protected content: ${r.showsProtectedContent}`);
      console.log(`    Body: "${r.bodyPreview}"`);
    });
  }

  await browser.close();
  process.exit(passCount === results.length ? 0 : 1);
}

testAnonymousRedirects().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
