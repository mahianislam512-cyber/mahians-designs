// Mahians Designs — Portfolio server + Admin API
const express = require('express');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const USE_CLOUD = !!process.env.CLOUDINARY_URL;
if (USE_CLOUD) cloudinary.config({ secure: true });

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 8080;
const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'content.json');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(DATA_DIR, 'uploads');

// ---------- ADMIN LOGIN (change these!) ----------
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'mahian123';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(16).toString('hex');
const SESS_FILE = path.join(DATA_DIR, 'sessions.json');
let sessions;
try { sessions = new Set(JSON.parse(fs.readFileSync(SESS_FILE, 'utf8'))); } catch { sessions = new Set(); }
const _add = sessions.add.bind(sessions), _del = sessions.delete.bind(sessions);
sessions.add = t => { _add(t); saveSess(); return sessions; };
sessions.delete = t => { const r = _del(t); saveSess(); return r; };
function saveSess() { try { fs.mkdirSync(path.dirname(SESS_FILE), { recursive: true }); fs.writeFileSync(SESS_FILE, JSON.stringify([...sessions])); } catch {} }

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

// ---------- DATA ----------
const DEFAULT = {
  profile: {
    name: 'Mahian', brand: 'Mahians Designs', title: 'Graphic Designer • Dhaka, Bangladesh',
    headline1: 'Crafting', headline2: 'Visual Stories', headline3: 'That Leave a Mark',
    bio: "I'm a professional graphic designer specializing in brand identity, social media creatives, and print design. I turn ideas into bold, memorable visuals that help brands stand out.",
    photo: '', cv: '',
    whatsapp: 'https://wa.me/qr/MF7FX6YDQPMFI1',
    discord: 'https://discord.com/users/1230145239365189697',
    phone: '+8801742678156',
    stats: { projects: 150, clients: 112, years: 4 },
    socials: {}
  },
  photos: [],   // {id,title,category,sub,image,createdAt}
  videos: []    // {id,title,category(motion|edit|design),ratio(16:9|9:16),tool,duration,desc,src,thumb,createdAt}
};
function load() {
  try { return { ...DEFAULT, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) }; }
  catch { return JSON.parse(JSON.stringify(DEFAULT)); }
}
const CLOUD_BACKUP_ID = 'mahians-designs/_content-backup';
let backupTimer = null;
function save(d) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
  if (USE_CLOUD) { clearTimeout(backupTimer); backupTimer = setTimeout(backupToCloud, 1500); }
}
async function backupToCloud() {
  try {
    const json = fs.readFileSync(DATA_FILE, 'utf8');
    await cloudinary.uploader.upload('data:application/json;base64,' + Buffer.from(json).toString('base64'),
      { public_id: CLOUD_BACKUP_ID, resource_type: 'raw', overwrite: true, invalidate: true });
    console.log('[backup] content.json saved to Cloudinary');
  } catch (e) { console.log('[backup] failed:', e.message); }
}
async function restoreFromCloud() {
  if (!USE_CLOUD) return;
  try {
    const local = load();
    const isEmpty = !local.photos.length && !local.videos.length;
    if (!isEmpty) return;
    const url = cloudinary.url(CLOUD_BACKUP_ID, { resource_type: 'raw', secure: true }) + '?t=' + Date.now();
    const res = await fetch(url);
    if (!res.ok) { console.log('[restore] no cloud backup yet'); return; }
    const remote = await res.json();
    if ((remote.photos && remote.photos.length) || (remote.videos && remote.videos.length)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(remote, null, 2));
      console.log(`[restore] restored ${remote.photos.length} photos, ${remote.videos.length} videos from Cloudinary`);
    }
  } catch (e) { console.log('[restore] failed:', e.message); }
}
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT, null, 2));

// ---------- MIDDLEWARE ----------
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
app.use((req, res, next) => {
  if (/\.(html|js)$/.test(req.path) || req.path === '/' || req.path === '/admin' || req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0'); res.set('Pragma', 'no-cache'); res.set('Expires', '0');
  }
  next();
});
app.use(express.static(path.join(ROOT, 'public'), { maxAge: 0, etag: false, lastModified: false }));

function getToken(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  return req.cookies.sid || '';
}
function auth(req, res, next) {
  if (sessions.has(getToken(req))) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const ok = /\.(jpe?g|png|webp|gif|svg|mp4|webm|mov|m4v|pdf)$/i.test(file.originalname);
    cb(ok ? null : new Error('File type not allowed'), ok);
  }
});

// ---------- PUBLIC API ----------
app.get('/health', (req, res) => res.json({ ok: true, cloud: USE_CLOUD }));
app.get('/api/content', (req, res) => res.json(load()));

// ---------- AUTH ----------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  console.log(`[login] user="${username}" ok=${username === ADMIN_USER && password === ADMIN_PASS}`);
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const sid = crypto.randomBytes(24).toString('hex');
    sessions.add(sid);
    res.cookie('sid', sid, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 7 * 24 * 3600 * 1000 });
    return res.json({ ok: true, token: sid });
  }
  res.status(401).json({ error: 'Wrong username or password' });
});
app.post('/api/logout', (req, res) => { sessions.delete(getToken(req)); res.clearCookie('sid'); res.json({ ok: true }); });
app.get('/api/me', (req, res) => res.json({ loggedIn: sessions.has(getToken(req)) }));

// ---------- UPLOAD ----------
app.post('/api/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  if (!USE_CLOUD) return res.json({ url: '/uploads/' + req.file.filename, name: req.file.originalname, size: req.file.size });
  try {
    const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(req.file.originalname);
    const MB = req.file.size / 1024 / 1024;
    if (isVideo && MB > 100) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: `Video is ${MB.toFixed(0)}MB — Cloudinary free plan allows max 100MB per video. Please compress it, or upload to YouTube and paste the link instead.` });
    }
    const opts = { folder: 'mahians-designs', resource_type: isVideo ? 'video' : 'auto', use_filename: true, unique_filename: true, timeout: 600000 };
    const r = isVideo
      ? await new Promise((ok, bad) => cloudinary.uploader.upload_large(req.file.path, { ...opts, chunk_size: 6 * 1024 * 1024 }, (e, x) => e ? bad(e) : ok(x)))
      : await cloudinary.uploader.upload(req.file.path, opts);
    console.log(`[upload] ${isVideo ? 'video' : 'image'} ${req.file.originalname} (${MB.toFixed(1)}MB) -> ${r.secure_url}`);
    fs.unlink(req.file.path, () => {});
    res.json({ url: r.secure_url, name: req.file.originalname, size: req.file.size, public_id: r.public_id });
  } catch (e) {
    fs.unlink(req.file.path, () => {});
    console.log('[upload] FAILED', req.file.originalname, e.message);
    res.status(500).json({ error: 'Cloud upload failed: ' + (e.message || JSON.stringify(e)) });
  }
});

// ---------- PROFILE ----------
app.put('/api/profile', auth, (req, res) => {
  const d = load();
  d.profile = { ...d.profile, ...req.body, stats: { ...d.profile.stats, ...(req.body.stats || {}) }, socials: { ...(d.profile.socials || {}), ...(req.body.socials || {}) } };
  save(d); res.json(d.profile);
});

// ---------- PHOTOS ----------
app.post('/api/photos', auth, (req, res) => {
  const d = load();
  const item = { id: crypto.randomUUID(), createdAt: Date.now(), ...req.body };
  d.photos.unshift(item); save(d); res.json(item);
});
app.put('/api/photos/:id', auth, (req, res) => {
  const d = load(); const i = d.photos.findIndex(p => p.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Not found' });
  d.photos[i] = { ...d.photos[i], ...req.body, id: d.photos[i].id }; save(d); res.json(d.photos[i]);
});
app.delete('/api/photos/:id', auth, (req, res) => {
  const d = load(); const item = d.photos.find(p => p.id === req.params.id);
  d.photos = d.photos.filter(p => p.id !== req.params.id); save(d);
  removeUpload(item && item.image); res.json({ ok: true });
});
app.post('/api/photos/reorder', auth, (req, res) => {
  const d = load(); const order = req.body.ids || [];
  d.photos.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)); save(d); res.json({ ok: true });
});

// ---------- VIDEOS ----------
app.post('/api/videos', auth, (req, res) => {
  const d = load();
  const item = { id: crypto.randomUUID(), createdAt: Date.now(), ...req.body };
  d.videos.unshift(item); save(d); res.json(item);
});
app.put('/api/videos/:id', auth, (req, res) => {
  const d = load(); const i = d.videos.findIndex(v => v.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Not found' });
  d.videos[i] = { ...d.videos[i], ...req.body, id: d.videos[i].id }; save(d); res.json(d.videos[i]);
});
app.delete('/api/videos/:id', auth, (req, res) => {
  const d = load(); const item = d.videos.find(v => v.id === req.params.id);
  d.videos = d.videos.filter(v => v.id !== req.params.id); save(d);
  if (item) { removeUpload(item.src); removeUpload(item.thumb); }
  res.json({ ok: true });
});
app.post('/api/videos/reorder', auth, (req, res) => {
  const d = load(); const order = req.body.ids || [];
  d.videos.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)); save(d); res.json({ ok: true });
});

function removeUpload(url) {
  if (!url) return;
  if (url.startsWith('/uploads/')) {
    const f = path.join(UPLOAD_DIR, path.basename(url));
    fs.existsSync(f) && fs.unlink(f, () => {});
  } else if (USE_CLOUD && /res\.cloudinary\.com/.test(url)) {
    const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    if (m) cloudinary.uploader.destroy(m[1], { resource_type: /\/video\//.test(url) ? 'video' : 'image' }).catch(() => {});
  }
}

// admin route
app.get('/admin', (req, res) => res.sendFile(path.join(ROOT, 'public', 'admin.html')));

app.use((err, req, res, next) => res.status(400).json({ error: err.message }));

async function syncCloudPhotos() {
  if (!USE_CLOUD) return;
  try {
    const d = load(); const have = new Set([...d.photos.map(p => p.image), ...d.videos.map(v => v.src), ...d.videos.map(v => v.thumb), d.profile.photo]);
    const r = await cloudinary.api.resources({ type: 'upload', prefix: 'mahians-designs/', resource_type: 'image', max_results: 500 });
    let n = 0;
    r.resources.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).forEach((x, i) => {
      if (have.has(x.secure_url) || x.public_id === CLOUD_BACKUP_ID) return;
      const ratio = x.width / x.height; const cat = ratio < 0.9 ? 'social' : (ratio > 1.6 ? 'ui' : 'brand');
      d.photos.push({ id: crypto.randomUUID(), createdAt: new Date(x.created_at).getTime(), title: 'Untitled Design', sub: 'Recovered — edit in admin', category: cat, image: x.secure_url, recovered: true });
      n++;
    });
    if (n) { save(d); console.log(`[sync] recovered ${n} photo(s) from Cloudinary that were missing in content`); }
  } catch (e) { console.log('[sync] failed:', e.message); }
}
app.post('/api/recover', auth, async (req, res) => { await restoreFromCloud(); await syncCloudPhotos(); res.json(load()); });

(async () => { await restoreFromCloud(); await syncCloudPhotos(); })();
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mahians Designs running on http://0.0.0.0:${PORT}`);
  console.log(`Admin panel: http://0.0.0.0:${PORT}/admin  (user: ${ADMIN_USER})`);
  console.log(`Storage: ${USE_CLOUD ? 'Cloudinary (persistent)' : 'local disk ' + UPLOAD_DIR}`);
});
