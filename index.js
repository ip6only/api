#!/usr/bin/node

const express = require('express');
const puppeteer = require('puppeteer-core');

const app = express();
const port = 3000;

app.get('/', async (req, res) => {
  const browser = await puppeteer.launch({
    'args': ['--headless', '--disable-gpu', '--disable-features=VizDisplayCompositor'],
    'executablePath': '/usr/bin/chromium-browser'
  });
  const page = await browser.newPage();
  await page.goto('https://example.com');
  const screenshot = await page.screenshot({
    'fullPage': true,
    'type': 'jpeg'
  });
  await browser.close();
  res.writeHead(200, {
    'Content-Type': 'image/jpeg',
    'Content-Length': screenshot.length
  });
  res.end(screenshot, 'binary');
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
