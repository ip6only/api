#!/usr/bin/node

const express = require('express');
const jimp = require('jimp');
const puppeteer = require('puppeteer-core');

const app = express();
const port = 3000;

const permittedPorts = [
  '80',
  '443',
  '591',
  '2082',
  '2083',
  '2086',
  '2087',
  '2095',
  '2096',
  '2222',
  '8008',
  '8080',
  '8443',
  '8880'
];

const permittedProtocols = [
  'http',
  'https'
];

const defaultWidth = 1280;
const maximumWidth = 1920;
const defaultHeight = 800;
const maximumHeight = 1200;

let width = undefined;
let height = undefined;

app.get('/favicon.ico', (req, res) => { return res.status(404).send() });

app.get('/screenshot/:url', async (req, res) => {
  try {
    // set width
    width = defaultWidth;
    if (req.query.width) {
      width = parseInt(req.query.width);
    }
    if (isNaN(width)) {
      const image = await generateErrorImage('width ' + req.query.width + ' doesn\'t appear to be a number');
      sendImage(res, image, 'image/png');
      return;
    }
    if (maximumWidth < width) {
      const image = await generateErrorImage('maximum width ' + maximumWidth + ' exceeded');
      sendImage(res, image, 'image/png');
      return;
    }

    // set height
    height = defaultHeight;
    if (req.query.height) {
      height = parseInt(req.query.height);
    }
    if (isNaN(height)) {
      const image = await generateErrorImage('height ' + req.query.height + ' doesn\'t appear to be a number');
      sendImage(res, image, 'image/png');
      return;
    }
    if (maximumHeight < height) {
      const image = await generateErrorImage('maximum height ' + maximumHeight + ' exceeded');
      sendImage(res, image, 'image/png');
      return;
    }

    // set URL
    const url = new URL(decodeURIComponent(req.params.url));

    // check port
    if (url.port && !permittedPorts.includes(url.port)) {
      // if we're using a non-default port that hasn't been permitted, block
      const image = await generateErrorImage('port ' + url.port + ' not permitted', width, height);
      sendImage(res, image, 'image/png');
      return;
    }

    // check protocol
    if (!permittedProtocols.includes(url.protocol.slice(0, -1))) {
      const image = await generateErrorImage('protocol ' + url.protocol.slice(0, -1) + ' not permitted', width, height);
      sendImage(res, image, 'image/png');
      return;
    }

    // launch browser
    const browser = await puppeteer.launch({
      'args': ['--headless', '--disable-gpu', '--disable-features=VizDisplayCompositor'],
      'executablePath': '/usr/bin/chromium-browser'
    });

    // set up page and viewport
    const page = await browser.newPage();
    page.setViewport({ width, height });

    // attempt to navigate to the URL
    await page.goto(url);

    // set offset (for screenshot)
    let offset = 0;
    if (req.query.offset && !isNaN(parseInt(req.query.offset))) {
      offset = parseInt(req.query.offset);
    }

    // get document height
    const documentHeight = await page.evaluate(() => {
      return document.documentElement.scrollHeight;
    });

    // check we're not exceeding the document bounds
    if (documentHeight < (offset + height)) {
      height = documentHeight - offset;
    }

    // take screenshot and set content type
    const image = await page.screenshot({
      'clip': {'x': 0, 'y': offset, width, height},
      'type': 'jpeg'
    });
    sendImage(res, image, 'image/jpeg');
  } catch(exception) {
    // generate error and set content type
    const image = await generateErrorImage(exception.message, width, height);
    sendImage(res, image, 'image/png');
  }
});

app.listen(port, () => console.log(`ip6only API listening on port ${port}!`));

async function generateErrorImage(text, width=defaultWidth, height=defaultHeight) {
    const image = await new jimp(width, height, '#C0C0C0');
    const font = await selectFontSizeFromWidth(width);
    text = 'Error: ' + text;
    const alignmentX = jimp.HORIZONTAL_ALIGN_CENTER;
    const alignmentY = jimp.VERTICAL_ALIGN_MIDDLE;
    image.print(font, 0, 0, { text, alignmentX, alignmentY }, width, height);
    return await image.getBufferAsync('image/png');
}

async function selectFontSizeFromWidth(width) {
  let font = undefined;
  if (width < 800) {
    font = await jimp.loadFont(jimp.FONT_SANS_16_BLACK);
  } else if (width < 1400) {
    font = await jimp.loadFont(jimp.FONT_SANS_32_BLACK);
  } else {
    font = await jimp.loadFont(jimp.FONT_SANS_64_BLACK);
  }
  return font;
}

function sendImage(response, image, imageType) {
  response.type(imageType);
  response.send(image);
}
