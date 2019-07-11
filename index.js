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

async function generateErrorImage(text, width, height) {
    image = await new jimp(width, height, '#C0C0C0');
    font = await jimp.loadFont(jimp.FONT_SANS_32_BLACK);
    image.print(font, 0, 0, { 'text': 'Error: ' + text, 'alignmentX': jimp.HORIZONTAL_ALIGN_CENTER, 'alignmentY': jimp.VERTICAL_ALIGN_MIDDLE }, width, height);
    return await image.getBufferAsync(jimp.MIME_PNG);
}

app.get('/favicon.ico', (req, res) => { return res.status(404).send() });

app.get('/screenshot/:url', async (req, res) => {
  // set up image and imageContentType
  let image = undefined;
  let imageContentType = undefined;

  // set width
  let width = defaultWidth;
  if (req.query.width && !isNaN(parseInt(req.query.width))) {
    width = parseInt(req.query.width);
  }
  if (maximumWidth < width) {
    image = await generateErrorImage('maximum width ' + maximumWidth + ' exceeded', defaultWidth, defaultHeight);
    imageType = 'image/png';
  }

  // set height
  let height = defaultHeight;
  if (req.query.height && !isNaN(parseInt(req.query.height))) {
    height = parseInt(req.query.height);
  }
  if (maximumHeight < height) {
    image = await generateErrorImage('maximum height ' + maximumHeight + ' exceeded', defaultWidth, defaultHeight);
    imageType = 'image/png';
  }

  // set URL
  const url = new URL(decodeURIComponent(req.params.url));

  // check port
  if (url.port && !permittedPorts.includes(url.port)) {
    // if we're using a non-default port that hasn't been permitted, block
    image = await generateErrorImage('port ' + url.port + ' not permitted', width, height);
    imageType = 'image/png';
  }

  // check protocol
  if (!permittedProtocols.includes(url.protocol.slice(0, -1))) {
    image = await generateErrorImage('protocol ' + url.protocol.slice(0, -1) + ' not permitted', width, height);
    imageType = 'image/png';
  }

  // if we don't yet have an image, generate one
  if (!image) {
    // launch browser
    const browser = await puppeteer.launch({
      'args': ['--headless', '--disable-gpu', '--disable-features=VizDisplayCompositor'],
      'executablePath': '/usr/bin/chromium-browser'
    });

    // set up page and viewport
    const page = await browser.newPage();
    page.setViewport({ 'width': width, 'height': height, 'deviceScaleFactor': 1 });

    try {
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
      image = await page.screenshot({
        'clip': {'x': 0, 'y': offset, 'width': width, 'height': height},
        'type': 'jpeg'
      });
      imageType = 'image/jpeg';
    } catch(exception) {
      // generate error and set content type
      image = await generateErrorImage(exception.message, width, height);
      imageType = 'image/png';
    }
    await browser.close();
  }

  // send the response back to the browser
  res.writeHead(200, {
    'Content-Type': imageType,
    'Content-Length': image.length
  });
  res.end(image, 'binary');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
