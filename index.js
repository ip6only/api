#!/usr/bin/node

const express = require('express');
const jimp = require('jimp');
const puppeteer = require('puppeteer-core');

const app = express();
const port = 3000;

async function generateErrorImage(text) {
    image = await new jimp(800, 600, '#C0C0C0');
    font = await jimp.loadFont(jimp.FONT_SANS_16_BLACK);
    image.print(font, 0, 0, { 'text': text, 'alignmentX': jimp.HORIZONTAL_ALIGN_CENTER, 'alignmentY': jimp.VERTICAL_ALIGN_MIDDLE }, 800, 600);
    return await image.getBufferAsync(jimp.MIME_PNG);
}

app.get('/favicon.ico', (req, res) => { return res.status(404).send() });

app.get('/screenshot/:url', async (req, res) => {
  const url = decodeURIComponent(req.params.url);
  const browser = await puppeteer.launch({
    'args': ['--headless', '--disable-gpu', '--disable-features=VizDisplayCompositor'],
    'executablePath': '/usr/bin/chromium-browser'
  });
  const page = await browser.newPage();
  let image = undefined;
  let imageContentType = undefined;
  try {
    await page.goto(url);
    image = await page.screenshot({
      'fullPage': true,
      'type': 'jpeg'
    });
    imageContentType = 'image/jpeg';
  } catch(exception) {
    image = await generateErrorImage(exception.message);
    imageContentType = 'image/png';
  }
  await browser.close();
  res.writeHead(200, {
    'Content-Type': imageContentType,
    'Content-Length': image.length
  });
  res.end(image, 'binary');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
