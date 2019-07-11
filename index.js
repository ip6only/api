#!/usr/bin/node

const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    'args': ['--headless', '--disable-gpu', '--disable-features=VizDisplayCompositor'],
    'executablePath': '/usr/bin/chromium-browser'
  });
  const page = await browser.newPage();
  await page.goto('https://bitbucket.org');
  await page.screenshot({
    'fullPage': true,
    'path': 'example.jpg',
    'type': 'jpeg'
  });

  await browser.close();
})();
