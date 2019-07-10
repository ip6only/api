#!/usr/bin/node

const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({ 'executablePath': '/usr/bin/chromium-browser' });
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({path: 'example.png'});

  await browser.close();
})();
