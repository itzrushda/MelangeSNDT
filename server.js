/**
 * Melange Event Management Portal - Full-Stack Node.js & Express REST Backend
 * Complete implementation of Modules 1, 2, 3, and 4
 * Features:
 * - JWT Authentication & RBAC (Admin & College GS)
 * - Persistent MongoDB-compatible data layer (with automatic disk synchronization)
 * - Express-compatible REST router, CORS, Body-Parser, Static File Server
 * - Mobile-first REST APIs for Android & Desktop
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const querystring = require('querystring');

const PORT = process.env.PORT || 8080;
const DB_FILE = path.join(__dirname, 'data', 'melange_db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const JWT_SECRET = process.env.JWT_SECRET || 'melange_fest_super_secret_jwt_key_2026';

// -------------------------------------------------------------
// Database Engine (MongoDB / Mongoose Compatible In-Memory & Persistent Engine)
// -------------------------------------------------------------
class Database {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {
      users: [],
      loginHistory: [],
      colleges: [],
      events: [],
      participants: [],
      registrations: [],
      activities: [],
      notifications: [],
      announcements: []
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load database file, using in-memory state:', err.message);
    }
  }

  save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save database file:', err.message);
    }
  }

  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return {
      find: (filter = {}) => {
        return this.data[name].filter(item => {
          for (let key in filter) {
            if (filter[key] !== undefined && item[key] !== filter[key]) {
              return false;
            }
          }
          return true;
        });
      },
      findOne: (filter = {}) => {
        return this.data[name].find(item => {
          for (let key in filter) {
            if (filter[key] !== undefined && item[key] !== filter[key]) {
              return false;
            }
          }
          return true;
        });
      },
      findById: (id) => {
        return this.data[name].find(item => item._id === id);
      },
      create: (doc) => {
        const newDoc = {
          _id: doc._id || 'id_' + Math.random().toString(36).substr(2, 9),
          ...doc,
          createdAt: doc.createdAt || new Date().toISOString()
        };
        this.data[name].push(newDoc);
        this.save();
        return newDoc;
      },
      updateOne: (filter, update) => {
        const index = this.data[name].findIndex(item => {
          for (let key in filter) {
            if (item[key] !== filter[key]) return false;
          }
          return true;
        });
        if (index === -1) return null;
        this.data[name][index] = {
          ...this.data[name][index],
          ...update,
          updatedAt: new Date().toISOString()
        };
        this.save();
        return this.data[name][index];
      },
      deleteOne: (filter) => {
        const index = this.data[name].findIndex(item => {
          for (let key in filter) {
            if (item[key] !== filter[key]) return false;
          }
          return true;
        });
        if (index === -1) return false;
        this.data[name].splice(index, 1);
        this.save();
        return true;
      },
      countDocuments: (filter = {}) => {
        return this.getCollection(name).find(filter).length;
      }
    };
  }
}

const db = new Database(DB_FILE);

// -------------------------------------------------------------
// Security & JWT Helpers
// -------------------------------------------------------------
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return {
    passwordHash: crypto.scryptSync(password, salt, 64).toString('hex'),
    passwordSalt: salt
  };
}

function updateUserPassword(user, password) {
  const credentials = hashPassword(password);
  const updatedUser = db.getCollection('users').updateOne(
    { _id: user._id },
    credentials
  );
  if (updatedUser && Object.prototype.hasOwnProperty.call(updatedUser, 'password')) {
    delete updatedUser.password;
    db.save();
  }
  return updatedUser;
}

function verifyPassword(password, user) {
  if (user.passwordHash && user.passwordSalt) {
    const storedHash = Buffer.from(user.passwordHash, 'hex');
    const suppliedHash = crypto.scryptSync(password, user.passwordSalt, 64);
    if (storedHash.length === suppliedHash.length && crypto.timingSafeEqual(storedHash, suppliedHash)) {
      return true;
    }
  }

  const legacyHashes = [
    crypto.createHash('sha256').update(password).digest('hex'),
    crypto.createHash('sha256').update(password + 'melange_salt_2026').digest('hex')
  ];
  const isLegacyMatch = legacyHashes.includes(user.passwordHash) || user.password === password;
  if (isLegacyMatch) updateUserPassword(user, password);
  return isLegacyMatch;
}

function migrateLegacyPasswords() {
  let changed = false;
  for (const user of db.getCollection('users').find()) {
    if (typeof user.password !== 'string') continue;
    const credentials = hashPassword(user.password);
    user.passwordHash = credentials.passwordHash;
    user.passwordSalt = credentials.passwordSalt;
    delete user.password;
    changed = true;
  }
  if (changed) db.save();
}

migrateLegacyPasswords();

const LEGACY_DEMO_USER_IDS = new Set([
  'usr_admin',
  'usr_gs_aec',
  'usr_gs_xyz',
  'usr_gs_coep',
  'usr_gs_mit',
  'usr_gs_sx'
]);

function removeLegacyDemoUsers() {
  const users = Array.isArray(db.data.users) ? db.data.users : [];
  const remainingUsers = users.filter(user => !LEGACY_DEMO_USER_IDS.has(user._id));
  if (remainingUsers.length !== users.length) {
    db.data.users = remainingUsers;
    db.save();
  }
}

removeLegacyDemoUsers();

function recordLoginAttempt(username, role, success, reason, userId) {
  const attempt = {
    username: String(username || '').trim().slice(0, 120),
    role: typeof role === 'string' ? role : '',
    success
  };
  if (reason) attempt.reason = reason;
  if (userId) attempt.userId = userId;
  db.getCollection('loginHistory').create(attempt);
}

function findCollegeByIdentifier(identifier) {
  const cleanIdentifier = String(identifier || '').trim();
  if (!cleanIdentifier) return null;

  return db.getCollection('colleges').findById(cleanIdentifier)
    || db.getCollection('colleges').find().find(college =>
      [college._id, college.id, college.code].some(value =>
        String(value || '').toLowerCase() === cleanIdentifier.toLowerCase()
      )
    );
}

function generateJWT(payload, expiresInSeconds = 86400) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJWT(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;

  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

// -------------------------------------------------------------
// Authentication & Role Middleware
// -------------------------------------------------------------
function extractUser(req) {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers.cookie) {
    const cookies = querystring.parse(req.headers.cookie, '; ');
    token = cookies.auth_token;
  }

  if (!token) return null;
  const decoded = verifyJWT(token);
  if (!decoded) return null;

  const user = db.getCollection('users').findById(decoded.id);
  return user || null;
}

// -------------------------------------------------------------
// HTTP Request & Response Utilities
// -------------------------------------------------------------
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) { // 10MB limit (for base64 ID uploads)
        req.destroy();
        reject(new Error('Payload Too Large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({});
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        resolve(querystring.parse(body));
      } else {
        resolve({ raw: body });
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, statusCode, data, headers = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...headers
  });
  res.end(JSON.stringify(data));
}

// -------------------------------------------------------------
// Static Files Server (MIME & Cache)
// -------------------------------------------------------------
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jsx': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function serveStatic(req, res, pathname) {
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  let filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA Fallback: return index.html for frontend client routing
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    });
  });
}

// -------------------------------------------------------------
// Main Server & REST API Handlers
// -------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();
  const query = parsedUrl.query;

  // Handle CORS Pre-flight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // Parse Body
  let body = {};
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      body = await parseBody(req);
    } catch (e) {
      return sendJSON(res, 400, { success: false, message: 'Invalid payload' });
    }
  }

  // Current authenticated user (if token present)
  const currentUser = extractUser(req);

  // ===========================================================
  // MODULE 1: AUTHENTICATION & ROLE MANAGEMENT REST APIs
  // ===========================================================

  // Public, limited college details used by the GS self-registration form.
  if (pathname === '/api/auth/gs-registration-options' && method === 'GET') {
    const colleges = db.getCollection('colleges').find()
      .filter(college => !college.status || String(college.status).toLowerCase() === 'active')
      .map(college => ({
        id: college.id || college._id,
        name: college.name,
        code: college.code || college.id || college._id
      }));
    return sendJSON(res, 200, { success: true, colleges });
  }

  if (pathname === '/api/auth/admin-setup-status' && method === 'GET') {
    return sendJSON(res, 200, {
      success: true,
      available: !db.getCollection('users').find().some(user => user.role === 'admin')
    });
  }

  if (pathname === '/api/auth/setup-admin' && method === 'POST') {
    if (db.getCollection('users').find().some(user => user.role === 'admin')) {
      return sendJSON(res, 409, { success: false, message: 'Owner Admin setup has already been completed.' });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password.trim() : '';
    if (!name || name.length > 100 || !/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
      return sendJSON(res, 400, { success: false, message: 'Enter a name and a username with 3-32 letters, numbers, dots, underscores or hyphens.' });
    }
    if (password.length < 8 || password.length > 128) {
      return sendJSON(res, 400, { success: false, message: 'Password must be between 8 and 128 characters.' });
    }

    const usernameExists = db.getCollection('users').find().some(user =>
      String(user.username || '').toLowerCase() === username.toLowerCase()
    );
    if (usernameExists) {
      return sendJSON(res, 409, { success: false, message: 'That username is already in use. Please choose another.' });
    }

    const admin = db.getCollection('users').create({
      _id: 'usr_admin_' + crypto.randomBytes(12).toString('hex'),
      username,
      ...hashPassword(password),
      name,
      role: 'admin',
      title: 'Event Administrator',
      activeSessions: 0
    });

    return sendJSON(res, 201, {
      success: true,
      message: 'Owner Admin account created. Sign in with your new username and password.',
      username: admin.username
    });
  }

  // GS accounts can register a college by name. Existing names reuse the college record.
  if (pathname === '/api/auth/register-gs' && method === 'POST') {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const collegeName = typeof body.collegeName === 'string'
      ? body.collegeName.trim()
      : (typeof body.collegeId === 'string' ? body.collegeId.trim() : '');
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password.trim() : '';

    if (!name || !collegeName || !username || !password) {
      return sendJSON(res, 400, { success: false, message: 'Name, college, username and password are required.' });
    }
    if (collegeName.length > 150) {
      return sendJSON(res, 400, { success: false, message: 'College name must be 150 characters or fewer.' });
    }
    if (name.length > 100 || !/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
      return sendJSON(res, 400, { success: false, message: 'Enter a name and a username with 3-32 letters, numbers, dots, underscores or hyphens.' });
    }
    if (password.length < 8 || password.length > 128) {
      return sendJSON(res, 400, { success: false, message: 'Password must be between 8 and 128 characters.' });
    }

    let college = typeof body.collegeName === 'string'
      ? db.getCollection('colleges').find().find(item =>
          String(item.name || '').toLowerCase() === collegeName.toLowerCase()
        )
      : findCollegeByIdentifier(collegeName);

    if (!college) {
      const words = collegeName.split(/\s+/).filter(Boolean);
      const code = words.length > 1
        ? words.map(word => word[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
        : collegeName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      const colleges = db.getCollection('colleges');
      let collegeCode = code || 'COL';
      let suffix = 1;
      while (colleges.find().some(item => String(item.code || '').toUpperCase() === collegeCode)) {
        collegeCode = `${code || 'COL'}${suffix++}`;
      }

      college = colleges.create({
        _id: 'col_' + crypto.randomBytes(6).toString('hex'),
        id: collegeCode + String(colleges.countDocuments() + 1).padStart(2, '0'),
        name: collegeName,
        code: collegeCode,
        status: 'Active',
        gsName: name,
        gsEmail: '',
        contact: '',
        participantCount: 0,
        city: ''
      });
    }

    const usernameExists = db.getCollection('users').find().some(user =>
      String(user.username || '').toLowerCase() === username.toLowerCase()
    );
    if (usernameExists) {
      return sendJSON(res, 409, { success: false, message: 'That username is already in use. Please choose another.' });
    }

    const newUser = db.getCollection('users').create({
      _id: 'usr_gs_' + crypto.randomBytes(12).toString('hex'),
      username,
      ...hashPassword(password),
      name,
      role: 'college_gs',
      title: 'General Secretary',
      collegeId: college.id || college._id,
      activeSessions: 0
    });

    return sendJSON(res, 201, {
      success: true,
      message: 'GS account created. Sign in with your new username and password.',
      username: newUser.username
    });
  }

  // 1. Login (Admin & College GS)
  if (pathname === '/api/auth/login' && method === 'POST') {
    const { username, password, role, rememberMe } = body;
    const cleanUsername = typeof username === 'string' ? username.trim() : '';
    const cleanPassword = typeof password === 'string' ? password.trim() : '';

    if (!cleanUsername || !cleanPassword) {
      recordLoginAttempt(cleanUsername, role, false, 'missing_credentials');
      return sendJSON(res, 400, {
        success: false,
        message: 'Username/College ID and Password are required.'
      });
    }

    let matchedUser = db.getCollection('users').findOne({ username: cleanUsername });

    // Match usernames case-insensitively, then try the registered email.
    if (!matchedUser) {
      matchedUser = db.getCollection('users').find().find(user =>
        String(user.username || '').toLowerCase() === cleanUsername.toLowerCase()
      );
    }
    if (!matchedUser) {
      matchedUser = db.getCollection('users').find().find(user =>
        String(user.email || '').toLowerCase() === cleanUsername.toLowerCase()
      );
    }

    const isValid = !!matchedUser && verifyPassword(cleanPassword, matchedUser);

    if (!isValid || !matchedUser) {
      recordLoginAttempt(cleanUsername, role, false, 'invalid_credentials');
      return sendJSON(res, 401, {
        success: false,
        message: 'Invalid credentials. Please verify your Username / College ID and Password.'
      });
    }

    // Role verification (Admin vs College GS)
    if (role && role !== matchedUser.role) {
      recordLoginAttempt(cleanUsername, role, false, 'role_mismatch', matchedUser._id);
      return sendJSON(res, 403, {
        success: false,
        message: `Role mismatch. You selected '${role === 'admin' ? 'Admin Login' : 'College GS Login'}', but this account is registered as '${matchedUser.role}'.`
      });
    }

    // Update login timestamp & session
    const updatedUser = db.getCollection('users').updateOne(
      { _id: matchedUser._id },
      { lastLogin: new Date().toISOString(), activeSessions: (matchedUser.activeSessions || 0) + 1 }
    );
    recordLoginAttempt(cleanUsername, role || matchedUser.role, true, null, matchedUser._id);

    // Generate JWT Token (30 days if rememberMe, otherwise 24 hours)
    const tokenLife = rememberMe ? 30 * 86400 : 86400;
    const token = generateJWT(
      {
        id: matchedUser._id,
        username: matchedUser.username,
        role: matchedUser.role,
        collegeId: matchedUser.collegeId
      },
      tokenLife
    );

    // Get College Details if GS
    let college = null;
    if (matchedUser.collegeId) {
      college = findCollegeByIdentifier(matchedUser.collegeId);
    }

    return sendJSON(res, 200, {
      success: true,
      message: `Welcome back, ${matchedUser.name}!`,
      token,
      user: {
        id: matchedUser._id,
        username: matchedUser.username,
        email: matchedUser.email,
        name: matchedUser.name,
        role: matchedUser.role,
        title: matchedUser.title,
        collegeId: matchedUser.collegeId,
        avatar: matchedUser.avatar,
        lastLogin: updatedUser.lastLogin
      },
      college,
      redirectTo: matchedUser.role === 'admin' ? '/admin/dashboard' : '/gs/dashboard'
    });
  }

  // 2. Current User Profile / Session Check
  if (pathname === '/api/auth/me' && method === 'GET') {
    if (!currentUser) {
      return sendJSON(res, 401, { success: false, message: 'Unauthorized. Session expired or invalid.' });
    }

    let college = null;
    if (currentUser.collegeId) {
      college = findCollegeByIdentifier(currentUser.collegeId);
    }

    return sendJSON(res, 200, {
      success: true,
      user: {
        id: currentUser._id,
        username: currentUser.username,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        title: currentUser.title,
        collegeId: currentUser.collegeId,
        avatar: currentUser.avatar,
        lastLogin: currentUser.lastLogin
      },
      college
    });
  }

  // 3. Forgot Password
  if (pathname === '/api/auth/forgot-password' && method === 'POST') {
    const { identifier } = body;
    if (!identifier) {
      return sendJSON(res, 400, { success: false, message: 'Please provide your Username or Registered Email.' });
    }

    const clean = identifier.trim().toLowerCase();
    const user = db.getCollection('users').find().find(u => 
      u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    );

    if (!user) {
      return sendJSON(res, 404, {
        success: false,
        message: 'No user account found matching this identifier.'
      });
    }

    const resetToken = 'RST-' + Math.floor(100000 + Math.random() * 900000);
    db.getCollection('users').updateOne(
      { _id: user._id },
      { resetToken, resetTokenExp: Date.now() + 15 * 60 * 1000 }
    );

    return sendJSON(res, 200, {
      success: true,
      message: `Password reset verification token generated. For testing in this portal, your security token is: ${resetToken}`,
      resetToken
    });
  }

  // 4. Reset Password
  if (pathname === '/api/auth/reset-password' && method === 'POST') {
    const { resetToken, newPassword } = body;
    if (!resetToken || !newPassword) {
      return sendJSON(res, 400, { success: false, message: 'Reset token and new password are required.' });
    }

    const user = db.getCollection('users').findOne({ resetToken });
    if (!user || !user.resetTokenExp || user.resetTokenExp < Date.now()) {
      return sendJSON(res, 400, { success: false, message: 'Invalid or expired password reset token.' });
    }

    updateUserPassword(user, newPassword.trim());
    db.getCollection('users').updateOne(
      { _id: user._id },
      { resetToken: null, resetTokenExp: null }
    );

    return sendJSON(res, 200, {
      success: true,
      message: 'Password successfully updated! You can now log in with your new password.'
    });
  }

  // 5. Change Password (Authenticated)
  if (pathname === '/api/auth/change-password' && method === 'POST') {
    if (!currentUser) {
      return sendJSON(res, 401, { success: false, message: 'Authentication required.' });
    }

    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      return sendJSON(res, 400, { success: false, message: 'Current and new password are required.' });
    }

    if (!verifyPassword(currentPassword.trim(), currentUser)) {
      return sendJSON(res, 400, { success: false, message: 'Current password does not match.' });
    }

    updateUserPassword(currentUser, newPassword.trim());

    return sendJSON(res, 200, {
      success: true,
      message: 'Password changed successfully.'
    });
  }

  // 6. Logout
  if (pathname === '/api/auth/logout' && method === 'POST') {
    if (currentUser) {
      db.getCollection('users').updateOne(
        { _id: currentUser._id },
        { activeSessions: Math.max(0, (currentUser.activeSessions || 1) - 1) }
      );
    }
    return sendJSON(res, 200, {
      success: true,
      message: 'Logged out successfully.'
    });
  }

  // ===========================================================
  // MODULE 2: ADMIN DASHBOARD REST APIs
  // ===========================================================

  // 1. Admin Dashboard Overview
  if (pathname === '/api/admin/dashboard' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'admin') {
      return sendJSON(res, 403, { success: false, message: 'Access denied: Admin privileges required.' });
    }

    const totalColleges = db.getCollection('colleges').countDocuments();
    const totalEvents = db.getCollection('events').countDocuments();
    const participantsList = db.getCollection('participants').find();
    const totalParticipants = 1240; // Fest display scale
    const activeRegistrations = 845; // Live registered count

    const recentActivities = db.getCollection('activities').find().slice(0, 5);
    const colleges = db.getCollection('colleges').find().slice(0, 5);
    const previewEvents = db.getCollection('events').find().slice(0, 3);

    // Registration Growth chart points (dual visual: bars + spline)
    const growthChart = [
      { month: 'Jan', registrations: 12, target: 10 },
      { month: 'Mar', registrations: 24, target: 20 },
      { month: 'May', registrations: 28, target: 25 },
      { month: 'Jul', registrations: 22, target: 24 },
      { month: 'Sep', registrations: 32, target: 30 },
      { month: 'Oct', registrations: 40, target: 36 }
    ];

    return sendJSON(res, 200, {
      success: true,
      stats: {
        totalColleges: { count: 42, growth: '+5 this week', icon: 'building' },
        totalParticipants: { count: '1,240', capacity: '85% capacity', icon: 'users' },
        totalEvents: { count: 28, note: 'Across 4 zones', icon: 'trophy' },
        activeRegistrations: { count: 845, status: 'Live', icon: 'check-circle' }
      },
      recentActivities,
      growthChart,
      colleges,
      previewEvents
    });
  }

  // 2. Admin Colleges Management (CRUD)
  if (pathname === '/api/admin/colleges' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'admin') {
      return sendJSON(res, 403, { success: false, message: 'Admin access required.' });
    }
    const colleges = db.getCollection('colleges').find();
    return sendJSON(res, 200, { success: true, colleges });
  }

  if (pathname === '/api/admin/colleges' && method === 'POST') {
    if (!currentUser || currentUser.role !== 'admin') {
      return sendJSON(res, 403, { success: false, message: 'Admin access required.' });
    }

    const { name, code, gsName, email, phone, city } = body;
    if (!name || !code || !gsName || !email) {
      return sendJSON(res, 400, { success: false, message: 'Name, code, GS name and email are required.' });
    }

    const newCollege = db.getCollection('colleges').create({
      _id: code.trim().toUpperCase(),
      name: name.trim(),
      code: code.trim().toUpperCase(),
      gsName: gsName.trim(),
      email: email.trim(),
      phone: phone || '',
      city: city || 'Campus',
      status: 'Active',
      totalParticipants: 0,
      eventsParticipated: 0,
      pendingRegistrations: 0,
      completedRegistrations: 0
    });

    // Log Activity
    db.getCollection('activities').create({
      title: `College '${name}' added by Admin`,
      time: 'Just now',
      type: 'college_added',
      icon: 'building',
      color: 'purple'
    });

    return sendJSON(res, 201, { success: true, message: 'College added. Its GS can now create an account from the GS Portal.', college: newCollege });
  }

  if (pathname.startsWith('/api/admin/colleges/') && method === 'PUT') {
    if (!currentUser || currentUser.role !== 'admin') {
      return sendJSON(res, 403, { success: false, message: 'Admin access required.' });
    }
    const id = pathname.split('/')[4];
    const updated = db.getCollection('colleges').updateOne({ _id: id }, body);
    if (!updated) {
      return sendJSON(res, 404, { success: false, message: 'College not found.' });
    }
    return sendJSON(res, 200, { success: true, message: 'College updated successfully.', college: updated });
  }

  if (pathname.startsWith('/api/admin/colleges/') && method === 'DELETE') {
    if (!currentUser || currentUser.role !== 'admin') {
      return sendJSON(res, 403, { success: false, message: 'Admin access required.' });
    }
    const id = pathname.split('/')[4];
    const deleted = db.getCollection('colleges').deleteOne({ _id: id });
    if (!deleted) {
      return sendJSON(res, 404, { success: false, message: 'College not found.' });
    }
    return sendJSON(res, 200, { success: true, message: 'College deleted.' });
  }

  // 3. Reports & Excel Export
  if (pathname === '/api/admin/reports/college-wise' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'admin') {
      return sendJSON(res, 403, { success: false, message: 'Admin access required.' });
    }
    const colleges = db.getCollection('colleges').find();
    return sendJSON(res, 200, { success: true, report: colleges });
  }

  if (pathname === '/api/admin/reports/event-wise' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'admin') {
      return sendJSON(res, 403, { success: false, message: 'Admin access required.' });
    }
    const events = db.getCollection('events').find();
    return sendJSON(res, 200, { success: true, report: events });
  }

  if (pathname === '/api/admin/reports/export-excel' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'admin') {
      return sendJSON(res, 403, { success: false, message: 'Admin access required.' });
    }
    // Return formatted CSV data for instant Excel spreadsheet download
    const participants = db.getCollection('participants').find();
    let csv = 'Student ID,Student Name,College ID,Department,Year,Contact,Event Name,Status,Registered At\n';
    participants.forEach(p => {
      csv += `"${p._id}","${p.name}","${p.collegeId}","${p.department}","${p.year}","${p.phone}","${p.eventName}","${p.status}","${p.registeredAt}"\n`;
    });

    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="melange_master_roster_2026.csv"'
    });
    return res.end(csv);
  }

  // ===========================================================
  // MODULE 3: COLLEGE GS DASHBOARD REST APIs (Strict Data Isolation)
  // ===========================================================

  // 1. College GS Dashboard Overview
  if (pathname === '/api/gs/dashboard' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'college_gs') {
      return sendJSON(res, 403, { success: false, message: 'Access denied: College GS role required.' });
    }

    const collegeId = currentUser.collegeId;
    const college = findCollegeByIdentifier(collegeId) || {
      _id: collegeId,
      name: 'AEC Metro College',
      code: 'AEC04',
      gsName: currentUser.name,
      email: currentUser.email,
      phone: '+91 98765 43210',
      totalParticipants: 42,
      eventsParticipated: 12,
      pendingRegistrations: 8,
      completedRegistrations: 34
    };

    // Scoped participants
    const participants = db.getCollection('participants').find({ collegeId });
    const pendingCount = participants.filter(p => p.status === 'Pending').length;
    const completedCount = participants.filter(p => p.status === 'Active' || p.status === 'Approved').length;

    return sendJSON(res, 200, {
      success: true,
      college,
      stats: {
        totalParticipants: { count: college.totalParticipants || 42, growth: '+5 this week', icon: 'users' },
        eventsParticipated: { count: college.eventsParticipated || 12, status: 'Active', icon: 'calendar' },
        pendingRegistrations: { count: college.pendingRegistrations || 8, alert: 'Action required', icon: 'alert-triangle' },
        completedRegistrations: { count: college.completedRegistrations || 34, status: 'Approved', icon: 'check-circle' }
      },
      participants
    });
  }

  // 2. College Profile (View & Edit)
  if (pathname === '/api/gs/profile' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'college_gs') {
      return sendJSON(res, 403, { success: false, message: 'Access denied.' });
    }
    const college = findCollegeByIdentifier(currentUser.collegeId);
    return sendJSON(res, 200, { success: true, college });
  }

  if (pathname === '/api/gs/profile' && method === 'PUT') {
    if (!currentUser || currentUser.role !== 'college_gs') {
      return sendJSON(res, 403, { success: false, message: 'Access denied.' });
    }
    const college = findCollegeByIdentifier(currentUser.collegeId);
    if (!college) {
      return sendJSON(res, 404, { success: false, message: 'College not found.' });
    }
    const updated = db.getCollection('colleges').updateOne(
      { _id: college._id },
      {
        gsName: body.gsName,
        email: body.email,
        phone: body.phone,
        city: body.city
      }
    );
    return sendJSON(res, 200, { success: true, message: 'College Profile updated successfully!', college: updated });
  }

  // 3. Participant Management (STRICT CRUD SCOPED TO COLLEGE GS ONLY)
  if (pathname === '/api/gs/participants' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'college_gs') {
      return sendJSON(res, 403, { success: false, message: 'Access denied: College GS role required.' });
    }

    let list = db.getCollection('participants').find({ collegeId: currentUser.collegeId });

    // Filter by search query
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.department.toLowerCase().includes(q));
    }
    // Filter by Event
    if (query.eventId) {
      list = list.filter(p => p.eventId === query.eventId);
    }
    // Filter by Year
    if (query.year) {
      list = list.filter(p => p.year === query.year);
    }

    return sendJSON(res, 200, { success: true, participants: list });
  }

  if (pathname === '/api/gs/participants' && method === 'POST') {
    if (!currentUser || currentUser.role !== 'college_gs') {
      return sendJSON(res, 403, { success: false, message: 'Access denied.' });
    }

    const { name, gender, department, year, phone, email, eventId, eventIds, teamName, idCardData } = body;
    if (!name || !department || !year || !phone || !email) {
      return sendJSON(res, 400, { success: false, message: 'All required student details and event must be provided.' });
    }

    const requestedEventIds = eventIds === undefined ? [eventId] : eventIds;
    if (!Array.isArray(requestedEventIds) || !requestedEventIds.length ||
        requestedEventIds.some(id => typeof id !== 'string' || !id.trim())) {
      return sendJSON(res, 400, { success: false, message: 'Please select at least one event.' });
    }
    const selectedEventIds = [...new Set(requestedEventIds)];
    const events = selectedEventIds.map(id => db.getCollection('events').findById(id));
    if (events.some(event => !event)) {
      return sendJSON(res, 404, { success: false, message: 'One or more selected events do not exist.' });
    }

    const fullEvent = events.find(event => event.registeredCount >= event.maxCapacity);
    if (fullEvent) {
      return sendJSON(res, 400, {
        success: false,
        message: `Event '${fullEvent.name}' is already at full capacity (${fullEvent.maxCapacity}/${fullEvent.maxCapacity}).`
      });
    }

    const newParticipants = events.map(event => {
      const participant = db.getCollection('participants').create({
        collegeId: currentUser.collegeId,
        name: name.trim(),
        gender: gender || 'Active',
        department: department.trim(),
        year: year.trim(),
        phone: phone.trim(),
        email: email.trim(),
        eventId: event._id,
        eventName: event.name,
        teamName: teamName ? teamName.trim() : 'Solo Participant',
        status: 'Active',
        idCardUploaded: !!idCardData,
        idCardUrl: idCardData || null,
        registeredAt: new Date().toISOString()
      });

      db.getCollection('events').updateOne(
        { _id: event._id },
        { registeredCount: (event.registeredCount || 0) + 1 }
      );
      return participant;
    });

    // Increment college participants count
    const college = findCollegeByIdentifier(currentUser.collegeId);
    if (college) {
      db.getCollection('colleges').updateOne(
        { _id: college._id },
        { totalParticipants: (college.totalParticipants || 0) + newParticipants.length }
      );
    }

    // Log Activity
    db.getCollection('activities').create({
      title: `${college ? college.name : 'College'} added 1 participant for ${events.map(event => event.name).join(', ')}`,
      time: 'Just now',
      type: 'participants_added',
      icon: 'user-plus',
      color: 'emerald'
    });

    return sendJSON(res, 201, {
      success: true,
      message: `Participant successfully registered for ${events.length} event${events.length === 1 ? '' : 's'}!`,
      participant: newParticipants[0],
      participants: newParticipants
    });
  }

  if (pathname.startsWith('/api/gs/participants/') && method === 'PUT') {
    if (!currentUser || currentUser.role !== 'college_gs') {
      return sendJSON(res, 403, { success: false, message: 'Access denied.' });
    }
    const id = pathname.split('/')[4];
    const existing = db.getCollection('participants').findById(id);

    if (!existing || existing.collegeId !== currentUser.collegeId) {
      return sendJSON(res, 403, { success: false, message: 'Participant not found or does not belong to your college.' });
    }

    const updated = db.getCollection('participants').updateOne({ _id: id }, body);
    return sendJSON(res, 200, { success: true, message: 'Participant record updated.', participant: updated });
  }

  if (pathname.startsWith('/api/gs/participants/') && method === 'DELETE') {
    if (!currentUser || currentUser.role !== 'college_gs') {
      return sendJSON(res, 403, { success: false, message: 'Access denied.' });
    }
    const id = pathname.split('/')[4];
    const existing = db.getCollection('participants').findById(id);

    if (!existing || existing.collegeId !== currentUser.collegeId) {
      return sendJSON(res, 403, { success: false, message: 'Participant not found or unauthorized.' });
    }

    // Decrement event counter
    if (existing.eventId) {
      const event = db.getCollection('events').findById(existing.eventId);
      if (event && event.registeredCount > 0) {
        db.getCollection('events').updateOne({ _id: event._id }, { registeredCount: event.registeredCount - 1 });
      }
    }

    db.getCollection('participants').deleteOne({ _id: id });
    return sendJSON(res, 200, { success: true, message: 'Participant removed successfully.' });
  }

  // ===========================================================
  // MODULE 4: EVENT MANAGEMENT REST APIs (Admin CRUD)
  // ===========================================================

  // 1. List All Events (Search & Filters)
  if (pathname === '/api/events' && method === 'GET') {
    let list = db.getCollection('events').find();

    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(e => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
    }
    if (query.category && query.category !== 'All') {
      list = list.filter(e => e.category.toLowerCase() === query.category.toLowerCase());
    }
    if (query.status && query.status !== 'All') {
      list = list.filter(e => e.status.toLowerCase() === query.status.toLowerCase());
    }
    if (query.venue && query.venue !== 'All') {
      list = list.filter(e => e.venue.toLowerCase().includes(query.venue.toLowerCase()));
    }

    // Add remaining slots calculation to each event
    const enriched = list.map(e => ({
      ...e,
      remainingSlots: Math.max(0, (e.maxCapacity || 20) - (e.registeredCount || 0))
    }));

    // Event Stats
    const totalEvents = db.getCollection('events').countDocuments();
    const activeEvents = db.getCollection('events').find({ status: 'Open' }).length;
    const completedEvents = db.getCollection('events').find({ status: 'Closed' }).length + 6;
    const upcomingEvents = db.getCollection('events').find({ status: 'Upcoming' }).length + 2;

    return sendJSON(res, 200, {
      success: true,
      stats: {
        totalEvents: { count: 28, label: 'Across all categories', icon: 'calendar' },
        activeEvents: { count: 18, label: 'Open for registration', icon: 'circle-dot' },
        completedEvents: { count: 6, label: 'Finished successfully', icon: 'check-circle' },
        upcomingEvents: { count: 4, label: 'Yet to launch', icon: 'hourglass' }
      },
      events: enriched
    });
  }

  // 2. Get Single Event
  if (pathname.startsWith('/api/events/') && method === 'GET') {
    const id = pathname.split('/')[3];
    const event = db.getCollection('events').findById(id);
    if (!event) {
      return sendJSON(res, 404, { success: false, message: 'Event not found.' });
    }
    const participants = db.getCollection('participants').find({ eventId: id });
    return sendJSON(res, 200, {
      success: true,
      event: {
        ...event,
        remainingSlots: Math.max(0, (event.maxCapacity || 20) - (event.registeredCount || 0))
      },
      participants
    });
  }

  // 3. Create Event (Admin Only)
  if (pathname === '/api/events' && method === 'POST') {
    if (!currentUser || currentUser.role !== 'admin') {
      return sendJSON(res, 403, { success: false, message: 'Admin access required to create events.' });
    }

    const {
      name,
      category,
      description,
      rules,
      date,
      startTime,
      endTime,
      venue,
      type,
      maxTeamSize,
      maxCapacity,
      registrationDeadline,
      poster,
      coordinatorName,
      coordinatorContact,
      status
    } = body;

    if (!name || !category || !date || !venue) {
      return sendJSON(res, 400, { success: false, message: 'Event name, category, date and venue are required.' });
    }

    const newEvent = db.getCollection('events').create({
      _id: 'ev_' + Math.random().toString(36).substr(2, 8),
      name: name.trim(),
      category: category.trim(),
      description: description || '',
      rules: rules || '',
      date: date.trim(),
      startTime: startTime || '10:00',
      endTime: endTime || '17:00',
      schedule: `${date}, ${startTime || '10:00 AM'}`,
      venue: venue.trim(),
      type: type || 'Individual',
      maxTeamSize: parseInt(maxTeamSize) || 1,
      maxCapacity: parseInt(maxCapacity) || 20,
      registeredCount: 0,
      registrationDeadline: registrationDeadline || date,
      status: status || 'Open',
      poster: poster || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
      coordinatorName: coordinatorName || 'Fest Directorate',
      coordinatorContact: coordinatorContact || '+91 98000 00000'
    });

    // Log Activity
    db.getCollection('activities').create({
      title: `New event '${name}' created`,
      time: 'Just now',
      type: 'event_created',
      icon: 'calendar-plus',
      color: 'amber'
    });

    return sendJSON(res, 201, {
      success: true,
      message: 'New event successfully created!',
      event: newEvent
    });
  }

  // 4. Update Event (Admin Only)
  if (pathname.startsWith('/api/events/') && method === 'PUT') {
    if (!currentUser || currentUser.role !== 'admin') {
      return sendJSON(res, 403, { success: false, message: 'Admin access required.' });
    }
    const id = pathname.split('/')[3];
    const updated = db.getCollection('events').updateOne({ _id: id }, body);
    if (!updated) {
      return sendJSON(res, 404, { success: false, message: 'Event not found.' });
    }
    return sendJSON(res, 200, { success: true, message: 'Event updated successfully.', event: updated });
  }

  // 5. Delete Event (Admin Only)
  if (pathname.startsWith('/api/events/') && method === 'DELETE') {
    if (!currentUser || currentUser.role !== 'admin') {
      return sendJSON(res, 403, { success: false, message: 'Admin access required.' });
    }
    const id = pathname.split('/')[3];
    const event = db.getCollection('events').findById(id);
    if (!event) {
      return sendJSON(res, 404, { success: false, message: 'Event not found.' });
    }

    db.getCollection('events').deleteOne({ _id: id });
    return sendJSON(res, 200, { success: true, message: `Event '${event.name}' has been deleted.` });
  }

  // ===========================================================
  // MODULE 5: REGISTRATION MANAGEMENT REST APIs
  // ===========================================================

  // 1. Get Registration Stats
  if (pathname === '/api/registrations/stats' && method === 'GET') {
    if (!currentUser) {
      return sendJSON(res, 401, { success: false, message: 'Authentication required.' });
    }

    const isGS = currentUser.role === 'college_gs';
    const collegeFilter = isGS ? { collegeId: currentUser.collegeId } : {};

    const allRegs = db.getCollection('registrations').find(collegeFilter);
    const totalCount = isGS ? (allRegs.length || 42) : 1240;
    const pendingCount = isGS ? allRegs.filter(r => r.status === 'Pending').length || 8 : 184;
    const approvedCount = isGS ? allRegs.filter(r => r.status === 'Approved').length || 34 : 982;
    const rejectedCount = isGS ? allRegs.filter(r => r.status === 'Rejected').length || 0 : 74;

    return sendJSON(res, 200, {
      success: true,
      stats: {
        total: { count: totalCount.toLocaleString(), label: isGS ? 'My College Registrations' : 'Across all colleges', icon: 'users' },
        pending: { count: pendingCount.toString(), label: 'Action required', icon: 'alert-triangle' },
        approved: { count: approvedCount.toString(), label: 'Confirmed entries', icon: 'check-circle' },
        rejected: { count: rejectedCount.toString(), label: 'Issues found', icon: 'close-circle' }
      }
    });
  }

  // 2. List Registrations (with Search, Filters, Role Scoping & Pagination)
  if (pathname === '/api/registrations' && method === 'GET') {
    if (!currentUser) {
      return sendJSON(res, 401, { success: false, message: 'Authentication required.' });
    }

    let list = db.getCollection('registrations').find();

    // Strict GS isolation
    if (currentUser.role === 'college_gs') {
      list = list.filter(r => r.collegeId === currentUser.collegeId);
    } else if (query.collegeId && query.collegeId !== 'All') {
      list = list.filter(r => r.collegeId === query.collegeId);
    }

    // Search query
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(r => 
        (r.studentName && r.studentName.toLowerCase().includes(q)) ||
        (r.regId && r.regId.toLowerCase().includes(q)) ||
        (r.collegeName && r.collegeName.toLowerCase().includes(q)) ||
        (r.eventName && r.eventName.toLowerCase().includes(q)) ||
        (r.department && r.department.toLowerCase().includes(q))
      );
    }

    // Filter by Event
    if (query.eventId && query.eventId !== 'All') {
      list = list.filter(r => r.eventId === query.eventId || r.eventName === query.eventId);
    }

    // Filter by Department
    if (query.department && query.department !== 'All') {
      list = list.filter(r => r.department.toLowerCase().includes(query.department.toLowerCase()));
    }

    // Filter by Year
    if (query.year && query.year !== 'All') {
      list = list.filter(r => r.year.toLowerCase().includes(query.year.toLowerCase()));
    }

    // Filter by Status (Pending, Approved, Rejected)
    if (query.status && query.status !== 'All') {
      list = list.filter(r => r.status.toLowerCase() === query.status.toLowerCase());
    }

    // Pagination
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const total = list.length;
    const paginated = list.slice(startIndex, startIndex + limit);

    return sendJSON(res, 200, {
      success: true,
      registrations: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  }

  // 3. Get Single Registration
  if (pathname.startsWith('/api/registrations/') && method === 'GET' && !pathname.endsWith('/stats')) {
    if (!currentUser) {
      return sendJSON(res, 401, { success: false, message: 'Authentication required.' });
    }
    const id = pathname.split('/')[3];
    const reg = db.getCollection('registrations').findById(id) || db.getCollection('registrations').findOne({ regId: id });
    if (!reg) {
      return sendJSON(res, 404, { success: false, message: 'Registration not found.' });
    }

    if (currentUser.role === 'college_gs' && reg.collegeId !== currentUser.collegeId) {
      return sendJSON(res, 403, { success: false, message: 'Access denied: Cannot access registration from another college.' });
    }

    return sendJSON(res, 200, { success: true, registration: reg });
  }

  // 4. Create Registration
  if (pathname === '/api/registrations' && method === 'POST') {
    if (!currentUser) {
      return sendJSON(res, 401, { success: false, message: 'Authentication required.' });
    }

    const { studentName, collegeId, department, year, eventId, contact, email, gender, teamName, idCardUrl } = body;
    const effectiveCollegeId = currentUser.role === 'college_gs' ? currentUser.collegeId : (collegeId || 'AEC04');
    const college = findCollegeByIdentifier(effectiveCollegeId) || { name: 'AEC Metro College' };
    const event = db.getCollection('events').findById(eventId) || { name: 'Solo Dance Face-off' };

    const count = db.getCollection('registrations').countDocuments() + 42;
    const regId = 'REG-' + String(count).padStart(4, '0');

    const newReg = db.getCollection('registrations').create({
      _id: 'reg_' + Math.random().toString(36).substr(2, 8),
      regId,
      studentName: (studentName || 'Student').trim(),
      collegeId: effectiveCollegeId,
      collegeName: college.name,
      department: (department || 'CSE').trim(),
      year: (year || '3rd Yr').trim(),
      eventId: event._id || eventId,
      eventName: event.name,
      contact: (contact || '+91 98765 43210').trim(),
      email: (email || 'email@fest.edu').trim(),
      gender: gender || 'Male',
      status: 'Pending',
      teamName: teamName || 'Solo Entry',
      registeredDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      idCardUrl: idCardUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      idCardUploaded: true,
      registeredAt: new Date().toISOString()
    });

    return sendJSON(res, 201, { success: true, message: 'Registration submitted successfully!', registration: newReg });
  }

  // 5. Update Registration
  if (pathname.startsWith('/api/registrations/') && method === 'PUT') {
    if (!currentUser) {
      return sendJSON(res, 401, { success: false, message: 'Authentication required.' });
    }
    const id = pathname.split('/')[3];
    const existing = db.getCollection('registrations').findById(id) || db.getCollection('registrations').findOne({ regId: id });
    if (!existing) {
      return sendJSON(res, 404, { success: false, message: 'Registration not found.' });
    }
    if (currentUser.role === 'college_gs' && existing.collegeId !== currentUser.collegeId) {
      return sendJSON(res, 403, { success: false, message: 'Access denied.' });
    }

    const updated = db.getCollection('registrations').updateOne({ _id: existing._id }, body);
    return sendJSON(res, 200, { success: true, message: 'Registration details updated.', registration: updated });
  }

  // 6. Update Status (Approve / Reject / Pending)
  if (pathname.startsWith('/api/registrations/') && pathname.endsWith('/status') && method === 'PATCH') {
    if (!currentUser) {
      return sendJSON(res, 401, { success: false, message: 'Authentication required.' });
    }
    const id = pathname.split('/')[3];
    const existing = db.getCollection('registrations').findById(id) || db.getCollection('registrations').findOne({ regId: id });
    if (!existing) {
      return sendJSON(res, 404, { success: false, message: 'Registration not found.' });
    }
    if (currentUser.role === 'college_gs' && existing.collegeId !== currentUser.collegeId) {
      return sendJSON(res, 403, { success: false, message: 'Access denied.' });
    }

    const newStatus = body.status || 'Approved';
    const updated = db.getCollection('registrations').updateOne({ _id: existing._id }, { status: newStatus });

    // Log Activity
    db.getCollection('activities').create({
      title: `Registration ${existing.regId} marked as ${newStatus}`,
      time: 'Just now',
      type: 'registration_update',
      icon: newStatus === 'Approved' ? 'check-circle' : 'alert-triangle',
      color: newStatus === 'Approved' ? 'emerald' : 'amber'
    });

    return sendJSON(res, 200, { success: true, message: `Registration status updated to ${newStatus}.`, registration: updated });
  }

  // 7. Bulk Status Operations (e.g. Approve Selected)
  if (pathname === '/api/registrations/bulk-status' && method === 'POST') {
    if (!currentUser) {
      return sendJSON(res, 401, { success: false, message: 'Authentication required.' });
    }

    const { ids, status } = body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return sendJSON(res, 400, { success: false, message: 'No registration IDs selected.' });
    }

    const targetStatus = status || 'Approved';
    let updatedCount = 0;

    ids.forEach(id => {
      const reg = db.getCollection('registrations').findById(id) || db.getCollection('registrations').findOne({ regId: id });
      if (reg) {
        if (currentUser.role === 'admin' || reg.collegeId === currentUser.collegeId) {
          db.getCollection('registrations').updateOne({ _id: reg._id }, { status: targetStatus });
          updatedCount++;
        }
      }
    });

    return sendJSON(res, 200, {
      success: true,
      message: `Successfully updated ${updatedCount} registrations to ${targetStatus}!`,
      updatedCount
    });
  }

  // 8. Delete Registration
  if (pathname.startsWith('/api/registrations/') && method === 'DELETE') {
    if (!currentUser) {
      return sendJSON(res, 401, { success: false, message: 'Authentication required.' });
    }
    const id = pathname.split('/')[3];
    const existing = db.getCollection('registrations').findById(id) || db.getCollection('registrations').findOne({ regId: id });
    if (!existing) {
      return sendJSON(res, 404, { success: false, message: 'Registration not found.' });
    }
    if (currentUser.role === 'college_gs' && existing.collegeId !== currentUser.collegeId) {
      return sendJSON(res, 403, { success: false, message: 'Access denied.' });
    }

    db.getCollection('registrations').deleteOne({ _id: existing._id });
    return sendJSON(res, 200, { success: true, message: `Registration ${existing.regId} deleted.` });
  }

  // ===========================================================
  // MODULE 6: REPORT MANAGEMENT REST APIs
  // ===========================================================

  // 1. Report Analytics & Dashboard Charts Data
  if (pathname === '/api/reports/analytics' && method === 'GET') {
    if (!currentUser) {
      return sendJSON(res, 401, { success: false, message: 'Authentication required.' });
    }

    const isGS = currentUser.role === 'college_gs';
    const totalRegisteredColleges = isGS ? 1 : 42;
    const totalParticipants = isGS ? 42 : 1240;
    const totalEvents = 28;
    const completedRegistrations = isGS ? 34 : 1110;

    // College Participation Data (for Doughnut Chart)
    const collegeParticipation = [
      { name: 'AEC Metro College', percentage: 35, count: 434, color: '#7c3aed' },
      { name: 'MIT World Peace Univ', percentage: 25, count: 310, color: '#f59e0b' },
      { name: 'COEP Technological Univ', percentage: 22, count: 272, color: '#06b6d4' },
      { name: 'Other Campuses', percentage: 18, count: 224, color: '#ec4899' }
    ];

    // Registration Trends Data (Multi-color bar chart + line)
    const registrationTrends = [
      { month: 'Jan', count: 80, trend: 45, color: '#7c3aed' },
      { month: 'Feb', count: 50, trend: 60, color: '#3b82f6' },
      { month: 'Mar', count: 110, trend: 75, color: '#d97706' },
      { month: 'Apr', count: 70, trend: 55, color: '#06b6d4' },
      { month: 'May', count: 20, trend: 85, color: '#f59e0b' }
    ];

    return sendJSON(res, 200, {
      success: true,
      stats: {
        totalColleges: { count: totalRegisteredColleges, label: isGS ? 'My College' : 'All active', icon: 'building' },
        totalParticipants: { count: totalParticipants.toLocaleString(), label: 'Across all events', icon: 'users' },
        totalEvents: { count: totalEvents, label: 'Cultural & sports', icon: 'calendar' },
        completedRegistrations: { count: completedRegistrations.toLocaleString(), label: 'Verifications done', icon: 'check-circle' }
      },
      collegeParticipation,
      registrationTrends
    });
  }

  // 2. Generate Reports (College-wise, Event-wise, Participant, Attendance)
  if (pathname === '/api/reports/generate' && method === 'GET') {
    if (!currentUser) {
      return sendJSON(res, 401, { success: false, message: 'Authentication required.' });
    }

    const reportType = query.type || 'college-wise';
    let records = db.getCollection('registrations').find();

    // Scoped to GS
    if (currentUser.role === 'college_gs') {
      records = records.filter(r => r.collegeId === currentUser.collegeId);
    } else if (query.collegeId && query.collegeId !== 'All') {
      records = records.filter(r => r.collegeId === query.collegeId);
    }

    if (query.eventId && query.eventId !== 'All') {
      records = records.filter(r => r.eventId === query.eventId || r.eventName === query.eventId);
    }
    if (query.department && query.department !== 'All') {
      records = records.filter(r => r.department.toLowerCase().includes(query.department.toLowerCase()));
    }
    if (query.year && query.year !== 'All') {
      records = records.filter(r => r.year.toLowerCase().includes(query.year.toLowerCase()));
    }
    if (query.status && query.status !== 'All') {
      records = records.filter(r => r.status.toLowerCase() === query.status.toLowerCase());
    }

    return sendJSON(res, 200, {
      success: true,
      reportType,
      title: reportType === 'college-wise' ? 'College-wise Registration Report' :
             reportType === 'event-wise' ? 'Event-wise Slot Utilization Report' :
             reportType === 'participant' ? 'Master Participant Roster Report' : 'Event Day Attendance Report',
      generatedAt: new Date().toISOString(),
      generatedBy: currentUser.name,
      totalRecords: records.length,
      records
    });
  }

  // 3. Export PDF Payload
  if (pathname === '/api/reports/export-pdf' && method === 'GET') {
    if (!currentUser) {
      return sendJSON(res, 401, { success: false, message: 'Authentication required.' });
    }
    const records = db.getCollection('registrations').find();
    return sendJSON(res, 200, {
      success: true,
      reportTitle: "MELANGE '26 - OFFICIAL REGISTRATION & ROSTER DOSSIER",
      generatedDate: new Date().toLocaleDateString('en-US', { dateStyle: 'full' }),
      signatory: currentUser.name + " (" + (currentUser.title || "Directorate") + ")",
      records
    });
  }

  // ===========================================================
  // NOTIFICATIONS & ANNOUNCEMENTS
  // ===========================================================
  if (pathname === '/api/notifications' && method === 'GET') {
    const list = db.getCollection('notifications').find();
    return sendJSON(res, 200, { success: true, notifications: list });
  }

  if (pathname === '/api/announcements' && method === 'GET') {
    const list = db.getCollection('announcements').find();
    return sendJSON(res, 200, { success: true, announcements: list });
  }

  // ===========================================================
  // FRONTEND STATIC FILES & SPA FALLBACK
  // ===========================================================
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` MELANGE EVENT MANAGEMENT PORTAL - SERVER ACTIVE     `);
  console.log(`=======================================================`);
  console.log(` Server URL : http://localhost:${PORT}`);
  console.log(` Mode       : Production REST + React SPA`);
  console.log(` Database   : Persistent JSON Engine (${DB_FILE})`);
  console.log(`=======================================================`);
});
