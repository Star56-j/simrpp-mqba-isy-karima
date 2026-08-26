import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'docs_screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureAllExact() {
  console.log('Capturing exact high-resolution screenshots from live web app...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1.5 });

  try {
    // 1. SCREENSHOT LOGIN SCREEN
    console.log('1. Capturing Login Screen...');
    await page.goto('https://akademikmqbaisykarima.pages.dev', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_screen.png') });

    // 2. LOGIN AS GURU (ustadz.abdullah)
    console.log('2. Logging in as Guru (ustadz.abdullah)...');
    const emailInput = await page.$('input[type="email"], input[type="text"]');
    const passInput = await page.$('input[type="password"]');
    if (emailInput && passInput) {
      await emailInput.click({ clickCount: 3 });
      await emailInput.type('ustadz.abdullah');
      await passInput.click({ clickCount: 3 });
      await passInput.type('guru123');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 3000));
    }

    // 2. DASHBOARD GURU
    console.log('2. Capturing Dashboard Guru...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_dashboard_guru.png') });

    // Function to click sidebar menu item
    const clickMenuItem = async (text) => {
      const items = await page.$$('button, a, div[role="button"]');
      for (const item of items) {
        const itemText = await page.evaluate(el => el.textContent, item);
        if (itemText && itemText.trim().toLowerCase().includes(text.toLowerCase())) {
          await item.click();
          await new Promise(r => setTimeout(r, 2000));
          return true;
        }
      }
      return false;
    };

    // 3. RPP SAYA
    console.log('3. Capturing RPP Saya...');
    await clickMenuItem('RPP Saya');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_rpp_saya.png') });

    // 4. ABSENSI SAYA (PRESENSI GURU)
    console.log('4. Capturing Absensi Saya (Presensi Guru)...');
    await clickMenuItem('Absensi Saya');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_absensi_guru.png') });

    // 5. ABSENSI SANTRI
    console.log('5. Capturing Absensi Santri...');
    await clickMenuItem('Absensi Santri');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_absensi_santri.png') });

    // 6. NILAI & RAPOR
    console.log('6. Capturing Nilai & Rapor...');
    await clickMenuItem('Nilai & Rapor');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_nilai_santri.png') });

    // 7. EVALUASI MAPEL GURU
    console.log('7. Capturing Evaluasi Mapel Guru...');
    await clickMenuItem('Evaluasi Bulanan Mapel');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_evaluasi_pembelajaran.png') });

    // 8. LOGOUT & LOGIN AS WALI KELAS (wali.abdullah)
    console.log('8. Logging in as Wali Kelas (wali.abdullah)...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('https://akademikmqbaisykarima.pages.dev', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const waliTab = await page.$('button ::-p-text(Wali Kelas)');
    if (waliTab) await waliTab.click();

    const emailWali = await page.$('input[type="email"], input[type="text"]');
    const passWali = await page.$('input[type="password"]');
    if (emailWali && passWali) {
      await emailWali.click({ clickCount: 3 });
      await emailWali.type('wali.abdullah');
      await passWali.click({ clickCount: 3 });
      await passWali.type('wali123');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 3000));
    }

    // 8. DASHBOARD WALI KELAS
    console.log('8. Capturing Dashboard Wali Kelas...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_dashboard_wali_kelas.png') });

    // 9. REKAP RAPOR KELAS
    console.log('9. Capturing Rekap Rapor Kelas...');
    await clickMenuItem('Rekap Rapor Kelas');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_rekap_rapor_kelas.png') });

    console.log('✅ All exact screenshots captured!');
  } catch (e) {
    console.error('Error during screenshot capturing:', e);
  } finally {
    await browser.close();
  }
}

captureAllExact();
