// Build static entry points for the GS portal and the event-management app.
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');
const publicIndex = path.join(publicDir, 'index.html');
const publicApp = path.join(publicDir, 'app.html');
const rootApp = path.join(rootDir, 'app.html');
const gsPortal = path.join(rootDir, 'gs-portal.html');

const portalPages = ['gs-portal.html', 'home.html', 'admin-portal.html'];
const requiredFiles = [rootApp, gsPortal, ...portalPages.map(file => path.join(rootDir, file))];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (!fs.existsSync(publicDir) || missingFiles.length > 0) {
  if (!fs.existsSync(publicDir)) missingFiles.push(publicDir);
  throw new Error('Required build files are missing: ' + missingFiles.join(', '));
}

const redirectPage = [
  '<!doctype html>',
  '<html lang="en">',
  '<head>',
  '  <meta charset="utf-8">',
  '  <meta name="viewport" content="width=device-width, initial-scale=1">',
  '  <title>Melange - General Secretary Portal</title>',
  '  <script>window.location.replace("./gs-portal.html");</script>',
  '</head>',
  '<body>',
  '  <p>Opening the GS Portal. <a href="./gs-portal.html">Continue to login</a>.</p>',
  '</body>',
  '</html>',
  ''
].join('\n');

fs.writeFileSync(path.join(rootDir, 'index.html'), redirectPage);
fs.writeFileSync(publicIndex, redirectPage);
fs.copyFileSync(rootApp, publicApp);

for (const page of portalPages) {
  fs.copyFileSync(path.join(rootDir, page), path.join(publicDir, page));
}

console.log('Built GS Portal entry points and preserved the event-management app as app.html.');
