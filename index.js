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

app.get('/favicon.ico', (request, response) => { return response.status(404).send() });

app.get('/v1/screenshot/:url', async (request, response) => {
  let errors = [];

  try {
    // set width
    width = defaultWidth;
    if (request.query.width) {
      width = parseInt(request.query.width);
    }
    if (isNaN(width)) {
      errors.push('Width ' + request.query.width + ' doesn\'t appear to be a number');
    }
    if (maximumWidth < width) {
      errors.push('Maximum width ' + maximumWidth + ' exceeded');
    }

    // set height
    height = defaultHeight;
    if (request.query.height) {
      height = parseInt(request.query.height);
    }
    if (isNaN(height)) {
      errors.push('Height ' + request.query.height + ' doesn\'t appear to be a number');
    }
    if (maximumHeight < height) {
      errors.push('Maximum height ' + maximumHeight + ' exceeded');
    }

    // set URL
    const url = new URL(decodeURIComponent(request.params.url));

    // check port
    if (url.port && !permittedPorts.includes(url.port)) {
      // if we're using a non-default port that hasn't been permitted, block
      errors.push('Port ' + url.port + ' not permitted');
    }

    // check protocol
    if (!permittedProtocols.includes(url.protocol.slice(0, -1))) {
      errors.push('Protocol ' + url.protocol.slice(0, -1) + ' not permitted');
    }

    // if we have errors at this stage, don't bother firing up the browser...
    if (errors.length) {
      response.end(JSON.stringify({errors}));
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
    if (request.query.offset && !isNaN(parseInt(request.query.offset))) {
      offset = parseInt(request.query.offset);
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
    response.end(JSON.stringify({image}));
  } catch(exception) {
    errors.push(exception.message);
    response.end(JSON.stringify({errors}));
  } finally {
    await browser.close();
  }
});

app.listen(port, () => console.log(`ip6only API listening on port ${port}!`));
