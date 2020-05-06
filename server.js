#!/usr/bin/node

const constants = require('./constants');
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

let width = undefined;
let height = undefined;

app.get('/favicon.ico', (request, response) => { return response.status(404).end() });

app.get('/v1/screenshot/:url', async (request, response) => {
  let errors = [];

  try {
    // set width
    width = constants.WIDTH_DEFAULT;
    if (request.query.width) {
      width = parseInt(request.query.width);
    }
    if (isNaN(width)) {
      errors.push('Width ' + request.query.width + ' doesn\'t appear to be a number');
    }
    if (constants.WIDTH_MAXIMUM < width) {
      errors.push('Maximum width ' + constants.WIDTH_MAXIMUM + ' exceeded');
    }

    // set height
    height = constants.HEIGHT_DEFAULT;
    if (request.query.height) {
      height = parseInt(request.query.height);
    }
    if (isNaN(height)) {
      errors.push('Height ' + request.query.height + ' doesn\'t appear to be a number');
    }
    if (constants.HEIGHT_MAXIMUM < height) {
      errors.push('Maximum height ' + constants.HEIGHT_MAXIMUM + ' exceeded');
    }

    // set URL
    const url = new URL(decodeURIComponent(request.params.url));

    // check port
    if (url.port && !constants.PERMITTED_PORTS.includes(url.port)) {
      // if we're using a non-default port that hasn't been permitted, block
      errors.push('Port ' + url.port + ' not permitted');
    }

    // check protocol
    if (!constants.PERMITTED_PROTOCOLS.includes(url.protocol.slice(0, -1))) {
      errors.push('Protocol ' + url.protocol.slice(0, -1) + ' not permitted');
    }

    // if we have errors at this stage, don't bother firing up the browser...
    if (errors.length) {
      response.json({errors});
      return;
    }

    // launch browser
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});

    // if anything fails beyond here, close the browser afterwards
    try {
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
      response.json({image});
    } catch(exception) {
      errors.push(exception.message);
      response.json({errors});
    } finally {
      await browser.close();
    }
  } catch(exception) {
    errors.push(exception.message);
    response.json({errors});
  }
});

app.listen(constants.PORT, () => console.log(`ip6only API listening on port ${constants.PORT}!`));
