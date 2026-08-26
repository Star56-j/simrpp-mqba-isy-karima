import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const RAW_DIR = 'docs_screenshots_raw';
const PROCESSED_DIR = 'docs_screenshots_processed';

if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });
if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });

async function captureHighQualityScreenshots() {
  console.log('Capturing ultra high-quality web screenshots...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  try {
    // 1. LOGIN SCREEN (Focused on the login card)
    console.log('1. Capturing Login Modal/Screen...');
    await page.goto('https://akademikmqbaisykarima.pages.dev', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    const loginCard = await page.$('div.relative.z-10.w-full.max-w-3xl') || await page.$('main');
    if (loginCard) {
      await loginCard.screenshot({ path: path.join(RAW_DIR, '01_login.png') });
    } else {
      await page.screenshot({ path: path.join(RAW_DIR, '01_login.png') });
    }

    // 2. LOGIN AS GURU
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

    // Helper to click sidebar menu item
    const clickSidebarMenu = async (label) => {
      const btns = await page.$$('button, a, div[role="button"]');
      for (const btn of btns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.trim().toLowerCase().includes(label.toLowerCase())) {
          await btn.click();
          await new Promise(r => setTimeout(r, 2000));
          return true;
        }
      }
      return false;
    };

    // Helper to capture main content area
    const captureMainContent = async (filename) => {
      const mainArea = await page.$('main') || await page.$('#root');
      if (mainArea) {
        await mainArea.screenshot({ path: path.join(RAW_DIR, filename) });
      } else {
        await page.screenshot({ path: path.join(RAW_DIR, filename) });
      }
    };

    // 2. DASHBOARD GURU
    console.log('2. Capturing Dashboard Guru...');
    await captureMainContent('02_dashboard.png');

    // 3. RPP SAYA
    console.log('3. Capturing RPP Saya...');
    await clickSidebarMenu('RPP Saya');
    await captureMainContent('03_rpp.png');

    // 4. ABSENSI SAYA (PRESENSI GURU)
    console.log('4. Capturing Absensi Saya (Presensi Guru)...');
    await clickSidebarMenu('Absensi Saya');
    await captureMainContent('04_absensi_guru.png');

    // 5. ABSENSI SANTRI
    console.log('5. Capturing Absensi Santri...');
    await clickSidebarMenu('Absensi Santri');
    await captureMainContent('05_absensi_santri.png');

    // 6. NILAI SANTRI
    console.log('6. Capturing Nilai & Rapor...');
    await clickSidebarMenu('Nilai & Rapor');
    await captureMainContent('06_nilai.png');

    // 7. EVALUASI MAPEL GURU
    console.log('7. Capturing Evaluasi Mapel Guru...');
    await clickSidebarMenu('Evaluasi Bulanan Mapel');
    await captureMainContent('07_evaluasi.png');

    // 8. LOGOUT & LOGIN WALI KELAS
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

    // 8. REKAP RAPOR KELAS WALI KELAS
    console.log('8. Capturing Rekap Rapor Kelas...');
    await clickSidebarMenu('Rekap Rapor Kelas');
    await captureMainContent('08_rekap_rapor.png');

    console.log('✅ Raw screenshots successfully captured!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }

  // POST-PROCESSING WITH SHARP: ADD PREMIUM WINDOW HEADER BAR & RESIZE
  console.log('Post-processing screenshots with sleek UI frames...');
  const files = [
    { in: '01_login.png', title: 'Portal Login - SIM RPP & Akademik MQBA Isy Karima' },
    { in: '02_dashboard.png', title: 'Dashboard Pengajar - Ringkasan Jadwal & KBM Harian' },
    { in: '03_rpp.png', title: 'RPP & Modul Ajar - Penyusunan RPP Berbantuan AI' },
    { in: '04_absensi_guru.png', title: 'Presensi Kehadiran Guru - 3 Dropdown Tanggal & Riwayat' },
    { in: '05_absensi_santri.png', title: 'Presensi Santri Per Pertemuan KBM & Jurnal Mengajar' },
    { in: '06_nilai.png', title: 'Pengelolaan Nilai Santri - Formatif, Sumatif, PTS & PAS' },
    { in: '07_evaluasi.png', title: 'Evaluasi Pembelajaran Guru - 8 Dimensi Kurikulum Merdeka' },
    { in: '08_rekap_rapor.png', title: 'Wali Kelas - Rekapitulasi Nilai & Cetak Rapor Santri' }
  ];

  for (const f of files) {
    const rawPath = path.join(RAW_DIR, f.in);
    if (!fs.existsSync(rawPath)) continue;

    const outPath = path.join(PROCESSED_DIR, f.in);
    
    // Create browser top bar SVG (properly XML-escaped)
    const width = 1200;
    const safeTitle = f.title.replace(/&/g, '&amp;');
    const headerSvg = Buffer.from(`
      <svg width="${width}" height="38" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="38" fill="#0f172a" rx="10" ry="10"/>
        <rect y="20" width="${width}" height="18" fill="#0f172a"/>
        <circle cx="22" cy="19" r="6" fill="#ef4444"/>
        <circle cx="40" cy="19" r="6" fill="#f59e0b"/>
        <circle cx="58" cy="19" r="6" fill="#10b981"/>
        <rect x="75" y="8" width="800" height="22" rx="6" fill="#1e293b"/>
        <text x="90" y="23" fill="#94a3b8" font-family="sans-serif" font-size="11" font-weight="bold">https://akademikmqbaisykarima.pages.dev · ${safeTitle}</text>
      </svg>
    `);

    const resizedImage = await sharp(rawPath)
      .resize({ width: width, height: 680, fit: 'cover', position: 'top' })
      .toBuffer();

    // Composite header bar on top of resized image
    await sharp({
      create: {
        width: width,
        height: 718,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      }
    })
    .composite([
      { input: headerSvg, top: 0, left: 0 },
      { input: resizedImage, top: 38, left: 0 }
    ])
    .jpeg({ quality: 86, progressive: true })
    .toFile(outPath);

    console.log(`✅ Processed: ${f.in}`);
  }

  console.log('🎉 All UI screenshots polished with browser frame!');
}

captureHighQualityScreenshots();
