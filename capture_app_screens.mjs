import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'docs_screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log('Launching browser to capture UI screenshots from https://akademikmqbaisykarima.pages.dev ...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

  try {
    // 1. SCREENSHOT LOGIN PAGE
    console.log('1. Capturing Login Page...');
    await page.goto('https://akademikmqbaisykarima.pages.dev', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_page.png') });

    // 2. LOGIN AS GURU (Ust. Abdullah Kristianto, S.Sos.)
    console.log('2. Logging in as Guru (ustadz.abdullah)...');
    // Try to click Pengajar button if available
    const pengajarBtn = await page.$('button ::-p-text(Pengajar)');
    if (pengajarBtn) await pengajarBtn.click();

    // Fill login form
    const emailInput = await page.$('input[type="email"], input[type="text"], input[placeholder*="username" i], input[placeholder*="email" i]');
    const passInput = await page.$('input[type="password"]');
    if (emailInput && passInput) {
      await emailInput.click({ clickCount: 3 });
      await emailInput.type('ustadz.abdullah');
      await passInput.click({ clickCount: 3 });
      await passInput.type('guru123');
      const submitBtn = await page.$('button[type="submit"], button ::-p-text(Masuk)');
      if (submitBtn) await submitBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 3000));
    }

    // 3. SCREENSHOT DASHBOARD GURU
    console.log('3. Capturing Dashboard Guru...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_dashboard_guru.png') });

    // 4. SCREENSHOT RPP
    console.log('4. Navigating to RPP...');
    const rppLink = await page.$('button ::-p-text(RPP), a ::-p-text(RPP), div ::-p-text(RPP & Modul Ajar)');
    if (rppLink) {
      await rppLink.click();
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_rpp_modul_ajar.png') });
    }

    // 5. SCREENSHOT PRESENSI GURU
    console.log('5. Navigating to Presensi Guru...');
    const presGuruLink = await page.$('button ::-p-text(Presensi Guru), a ::-p-text(Presensi Guru), div ::-p-text(Presensi Guru)');
    if (presGuruLink) {
      await presGuruLink.click();
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_presensi_guru.png') });
    }

    // 6. SCREENSHOT PRESENSI SANTRI
    console.log('6. Navigating to Presensi Santri...');
    const presSantriLink = await page.$('button ::-p-text(Presensi Santri), a ::-p-text(Presensi Santri), div ::-p-text(Presensi Santri)');
    if (presSantriLink) {
      await presSantriLink.click();
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_presensi_santri.png') });
    }

    // 7. SCREENSHOT PENILAIAN
    console.log('7. Navigating to Penilaian...');
    const nilaiLink = await page.$('button ::-p-text(Penilaian), a ::-p-text(Penilaian), div ::-p-text(Penilaian Santri)');
    if (nilaiLink) {
      await nilaiLink.click();
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_penilaian_santri.png') });
    }

    // 8. SCREENSHOT EVALUASI PEMBELAJARAN
    console.log('8. Navigating to Evaluasi Pembelajaran...');
    const evalLink = await page.$('button ::-p-text(Evaluasi), a ::-p-text(Evaluasi), div ::-p-text(Evaluasi Guru), div ::-p-text(Evaluasi Pembelajaran)');
    if (evalLink) {
      await evalLink.click();
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_evaluasi_pembelajaran.png') });
    }

    // 9. LOGOUT & LOGIN AS WALI KELAS
    console.log('9. Logging out and logging in as Wali Kelas (wali.abdullah)...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('https://akademikmqbaisykarima.pages.dev', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const waliTab = await page.$('button ::-p-text(Wali Kelas)');
    if (waliTab) await waliTab.click();

    const emailWali = await page.$('input[type="email"], input[type="text"], input[placeholder*="username" i], input[placeholder*="email" i]');
    const passWali = await page.$('input[type="password"]');
    if (emailWali && passWali) {
      await emailWali.click({ clickCount: 3 });
      await emailWali.type('wali.abdullah');
      await passWali.click({ clickCount: 3 });
      await passWali.type('wali123');
      const submitBtn = await page.$('button[type="submit"], button ::-p-text(Masuk)');
      if (submitBtn) await submitBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_wali_kelas_dashboard.png') });
    }

    console.log('✅ All screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
