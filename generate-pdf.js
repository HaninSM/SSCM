const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  // Find browser executable
  const possiblePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  ];

  let executablePath = possiblePaths.find(p => fs.existsSync(p));
  if (!executablePath) {
    console.error('Executable browser (Edge atau Chrome) tidak ditemukan!');
    process.exit(1);
  }

  console.log(`Menggunakan browser: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  const htmlPath = path.resolve(__dirname, 'docs', 'tutorial.html');
  console.log(`Membuka file HTML: ${htmlPath}`);

  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, {
    waitUntil: 'networkidle0'
  });

  const pdfPath = path.resolve(__dirname, 'docs', 'Tutorial_SSCM_System.pdf');

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      right: '16mm',
      bottom: '18mm',
      left: '16mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width:100%; text-align:center; font-size:8pt; color:#94a3b8; font-family:'Segoe UI',sans-serif; padding:0 16mm; display:flex; justify-content:space-between;">
        <span>Buku Panduan Operasional SSCM System</span>
        <span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span>
      </div>
    `
  });

  console.log(`✅ File PDF berhasil dibuat di: ${pdfPath}`);
  await browser.close();
})();
