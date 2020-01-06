#!/usr/bin/node

const express = require('express');
const puppeteer = require('puppeteer-core');

const app = express();
const port = process.env.PORT || 3000;

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
      sendError(res, 'width ' + req.query.width + ' doesn\'t appear to be a number');
      return;
    }
    if (maximumWidth < width) {
      sendError(res, 'maximum width ' + maximumWidth + ' exceeded');
      return;
    }

    // set height
    height = defaultHeight;
    if (req.query.height) {
      height = parseInt(req.query.height);
    }
    if (isNaN(height)) {
      sendError(res, 'height ' + req.query.height + ' doesn\'t appear to be a number');
      return;
    }
    if (maximumHeight < height) {
      sendError(res, 'maximum height ' + maximumHeight + ' exceeded');
      return;
    }

    // set URL
    const url = new URL(decodeURIComponent(req.params.url));

    // check port
    if (url.port && !permittedPorts.includes(url.port)) {
      // if we're using a non-default port that hasn't been permitted, block
      sendError(res, 'port ' + url.port + ' not permitted');
      return;
    }

    // check protocol
    if (!permittedProtocols.includes(url.protocol.slice(0, -1))) {
      sendError(res, 'protocol ' + url.protocol.slice(0, -1) + ' not permitted');
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
      'encoding': 'base64',
      'type': 'jpeg'
    });
    res.end(JSON.stringify({image}));
  } catch(exception) {;
    // generate error and set content type
    sendError(res, exception.message);
  }
});

app.listen(port, () => console.log(`ip6only API listening on port ${port}!`));

function sendError(response, error) {
  response.end(JSON.stringify({error}));
}
