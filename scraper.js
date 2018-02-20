#!/usr/bin/env node

// TODO: Handle timeouts and promise rejections.

const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3');

const config = require('./config');

const db = new sqlite3.Database(path.join(__dirname, 'data.db'));

const COOKIE_JAR = path.join(os.homedir(), `.config/weibo/cookies/${config.userid}.json`);

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  let cookies = JSON.parse(fs.readFileSync(COOKIE_JAR, { encoding: 'utf-8' }));
  await page.setCookie(...cookies);

  await page.goto('https://weibo.com/p/100808394e5749fd0cc7e969e37502ac1f1812/super_index');

  await page.waitForSelector('meta[name=description]');
  const timestamp = Date.now();
  const description = await page.$eval('meta[name=description]', el => el.getAttribute('content'));
  const m = description.match(/阅读:(\d+),帖子:(\d+),粉丝:(\d+)/);
  if (m) {
    const views = m[1];
    const posts = m[2];
    const followers = m[3];
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER NOT NULL,
                views INTEGER NOT NULL,
                posts INTEGER NOT NULL,
                followers INTEGER NOT NULL
              );`);
      db.run('INSERT INTO stats (timestamp,views,posts,followers) VALUES (?,?,?,?)',
             timestamp, views, posts, followers);
    });
  } else {
    console.error(`unrecognized description: ${description}`);
  }

  await browser.close();
})();
