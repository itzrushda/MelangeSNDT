const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'melange_db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const legacyDemoUserIds = new Set([
  'usr_admin',
  'usr_gs_aec',
  'usr_gs_xyz',
  'usr_gs_coep',
  'usr_gs_mit',
  'usr_gs_sx'
]);

const currentUsers = Array.isArray(db.users) ? db.users : [];
db.users = currentUsers.filter(user => !legacyDemoUserIds.has(user._id));
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

console.log(`Removed ${currentUsers.length - db.users.length} legacy demo accounts. Users must create their own credentials.`);
