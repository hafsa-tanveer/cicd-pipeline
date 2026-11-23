// Packages the static site into dist/ and stamps the version into the footer.
// Usage: node scripts/build.js   (GITHUB_RUN_NUMBER is added when run in CI)
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const { version } = require(path.join(root, 'package.json'));
const run = process.env.GITHUB_RUN_NUMBER;
const sha = (process.env.GITHUB_SHA || '').slice(0, 7);
const label = 'v' + version + (run ? ' · build ' + run : '') + (sha ? ' · ' + sha : '');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace('__APP_VERSION__', label);
fs.writeFileSync(path.join(dist, 'index.html'), html);
fs.cpSync(path.join(root, 'js'), path.join(dist, 'js'), { recursive: true });
fs.cpSync(path.join(root, 'assets'), path.join(dist, 'assets'), { recursive: true });
fs.writeFileSync(path.join(dist, 'version.txt'), label + '\n');
console.log('Built dist/ for ' + label);
