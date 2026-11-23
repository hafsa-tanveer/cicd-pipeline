// Checks the page itself: the neutral store ships without any study tooling
// and loads the scripts it needs.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('index.html loads the pricing module before the app', () => {
  const pricing = html.indexOf('src="js/pricing.js"');
  const app = html.indexOf('src="js/app.js"');
  assert.ok(pricing > -1 && app > -1, 'both scripts are referenced');
  assert.ok(pricing < app, 'pricing.js must load first');
});

test('no screen recording, consent gate or study taskbar is shipped', () => {
  const app = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
  for (const word of ['getDisplayMedia', 'MediaRecorder', 'consent-gate', 'taskbar']) {
    assert.ok(!html.includes(word) && !app.includes(word), word + ' should not be present');
  }
});

test('footer has a version placeholder for the build step to fill in', () => {
  assert.ok(html.includes('__APP_VERSION__'));
});

test('every product image referenced by the app exists', () => {
  const app = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
  const images = [...app.matchAll(/image: ["'](assets\/[^"']+)["']/g)].map((m) => decodeURIComponent(m[1]));
  assert.ok(images.length > 0);
  for (const img of images) assert.ok(fs.existsSync(path.join(root, img)), 'missing ' + img);
});
