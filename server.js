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
  site: null,   // customizable site structure (null = use DEFAULT_SITE)
  photos: [],   // {id,title,category,sub,image,createdAt}
  videos: []    // {id,title,category(motion|edit|design),ratio(16:9|9:16),tool,duration,desc,src,thumb,createdAt}
};
const DEFAULT_SITE = {
  theme: { accent: '#7c5cff', accent2: '#ff5c9a', accent3: '#22d3ee' },
  categories: [
    { key:'brand', name:'Branding', subs:'' },
    { key:'social', name:'Social Media', subs:'Facebook, YouTube, Instagram, TikTok, LinkedIn, X (Twitter), Pinterest, WhatsApp, Other' },
    { key:'gaming', name:'Gaming', subs:'Gaming Logo / Mascot, Banner / Header, Stream Thumbnail, Stream Overlay, Tournament Poster, Emotes / Badges, Other' },
    { key:'print', name:'Print', subs:'' },
    { key:'ui', name:'UI / Web', subs:'' }
  ],
  videoTabs: [
    { key:'motion', name:'Motion Graphics', emoji:'✨' },
    { key:'edit', name:'Video Edit', emoji:'✂️' },
    { key:'design', name:'Graphics Designs', emoji:'🎨' }
  ],
  services: [
    { emoji:'💠', title:'Brand Identity', desc:'Logo, colors & brand guidelines.' },
    { emoji:'📱', title:'Social Media Design', desc:'Posts, stories, banners & ads.' },
    { emoji:'🖥️', title:'UI / Web Graphics', desc:'Hero banners, icons & web visuals.' },
    { emoji:'🖨️', title:'Print Design', desc:'Cards, flyers, posters & packaging.' },
    { emoji:'✏️', title:'Illustration', desc:'Custom art, mascots & characters.' },
    { emoji:'🎬', title:'Thumbnail & Motion', desc:'YouTube thumbnails & motion posts.' }
  ],
  skills: [
    { name:'Logo & Brand Identity', percent:95 }, { name:'Social Media Design', percent:92 }, { name:'Typography & Layout', percent:88 },
    { name:'UI / Web Graphics', percent:85 }, { name:'Illustration', percent:80 }, { name:'Motion Graphics', percent:70 }
  ],
  tools: [
    { abbr:'Ps', name:'Photoshop', color:'#31a8ff' }, { abbr:'Ai', name:'Illustrator', color:'#ff9a00' }, { abbr:'Id', name:'InDesign', color:'#ff3366' },
    { abbr:'Fg', name:'Figma', color:'#f24e1e' }, { abbr:'Ae', name:'After Effects', color:'#9999ff' }, { abbr:'Cv', name:'Canva', color:'#00c4cc' },
    { abbr:'Xd', name:'Adobe XD', color:'#ff61f6' }, { abbr:'Pr', name:'Premiere', color:'#9999ff' }, { abbr:'Bl', name:'Blender', color:'#e5e7eb' }
  ],
  process: [
    { emoji:'🔍', title:'Discover', desc:'Understanding your brand, audience and goals through a detailed brief.' },
    { emoji:'✏️', title:'Sketch', desc:'Exploring concepts, moodboards and rough directions before refining.' },
    { emoji:'🎨', title:'Design', desc:'Crafting pixel-perfect visuals with attention to every detail.' },
    { emoji:'🚀', title:'Deliver', desc:'Revisions, final files in all formats, and ongoing support.' }
  ],
  testimonials: [
    { name:'Rafiq Ahmed', role:'CEO, Aurora Tech', text:'Mahian completely transformed our brand. The logo and identity system exceeded every expectation. Fast, professional and incredibly creative.', stars:5 },
    { name:'Sadia Nawar', role:'Marketing Lead, Trendy BD', text:'Our social media engagement doubled after switching to Mahians Designs. The creatives are clean, bold and always on time.', stars:5 },
    { name:'James Kim', role:'Content Creator', text:'Excellent communication and top-tier design quality. The YouTube thumbnails boosted my click-through rate by 40%. Highly recommended!', stars:5 }
  ],
  sections: {
    services: { visible:true, title:'Services', pill:'What I do' },
    portfolio: { visible:true, title:'Featured Work', pill:'Portfolio' },
    videos: { visible:true, title:'Video Showcase', pill:'Videos' },
    skills: { visible:true, title:'Skills & Tools', pill:'Expertise' },
    process: { visible:true, title:'My Process', pill:'How I work' },
    testimonials: { visible:true, title:'Client Reviews', pill:'Testimonials' },
    contact: { visible:true, title:"Let's Work Together", pill:'Contact' }
  },
  customSections: [] // { key, title, pill, intro, items:[{emoji,title,desc,link}] }
};
function load() {
  try { return { ...DEFAULT, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) }; }
  catch { return JSON.parse(JSON.stringify(DEFAULT)); }
}
const CLOUD_BACKUP_ID = 'mahians-designs/_content-backup';
let backupTimer = null;
function save(d) {
  d.updatedAt = Date.now();
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
  if (USE_CLOUD) { clearTimeout(backupTimer); backupTimer = setTimeout(backupToCloud, 1500); }
}
process.on('SIGTERM', async () => { clearTimeout(backupTimer); await backupToCloud(); process.exit(0); });
async function backupToCloud() {
  try {
    const json = fs.readFileSync(DATA_FILE, 'utf8');
    await cloudinary.uploader.upload('data:application/json;base64,' + Buffer.from(json).toString('base64'),
      { public_id: CLOUD_BACKUP_ID, resource_type: 'raw', overwrite: true, invalidate: true });
    console.log('[backup] content.json saved to Cloudinary');
  } catch (e) { console.log('[backup] failed:', e.message); }
}
async function fetchCloudBackup() {
  // Use the Admin API to get the exact current version -> versioned URL is never served stale by the CDN
  const meta = await cloudinary.api.resource(CLOUD_BACKUP_ID, { resource_type: 'raw' });
  const url = cloudinary.url(CLOUD_BACKUP_ID, { resource_type: 'raw', secure: true, version: meta.version }) + '?t=' + Date.now();
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return await res.json();
}
async function restoreFromCloud() {
  if (!USE_CLOUD) return;
  try {
    const local = load();
    const remote = await fetchCloudBackup();
    const localEmpty = !local.photos.length && !local.videos.length;
    const remoteNewer = (remote.updatedAt || 0) > (local.updatedAt || 0);
    if (localEmpty || remoteNewer) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(remote, null, 2));
      console.log(`[restore] restored from Cloudinary (${remote.photos.length} photos, ${remote.videos.length} videos, updated ${new Date(remote.updatedAt||0).toISOString()})`);
    } else console.log('[restore] local data is up to date');
  } catch (e) { console.log('[restore] skipped:', e.message); }
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
app.get('/api/content', (req, res) => { const d = load(); if (!d.site) d.site = DEFAULT_SITE; res.json(d); });
app.get('/api/site/defaults', (req, res) => res.json(DEFAULT_SITE));
app.put('/api/site', auth, (req, res) => { const d = load(); d.site = { ...DEFAULT_SITE, ...(d.site || {}), ...req.body }; save(d); res.json(d.site); });
app.post('/api/site/reset', auth, (req, res) => { const d = load(); d.site = null; save(d); res.json(DEFAULT_SITE); });

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
app.delete('/api/photos/:id', auth, async (req, res) => {
  const d = load(); const item = d.photos.find(p => p.id === req.params.id);
  d.photos = d.photos.filter(p => p.id !== req.params.id);
  if (item) markDeleted(d, item.image);
  save(d);
  await removeUpload(item && item.image);
  res.json({ ok: true });
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
app.delete('/api/videos/:id', auth, async (req, res) => {
  const d = load(); const item = d.videos.find(v => v.id === req.params.id);
  d.videos = d.videos.filter(v => v.id !== req.params.id);
  if (item) { markDeleted(d, item.src); markDeleted(d, item.thumb); }
  save(d);
  if (item) { await removeUpload(item.src); await removeUpload(item.thumb); }
  res.json({ ok: true });
});
app.post('/api/videos/reorder', auth, (req, res) => {
  const d = load(); const order = req.body.ids || [];
  d.videos.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)); save(d); res.json({ ok: true });
});

async function removeUpload(url) {
  if (!url) return;
  if (url.startsWith('/uploads/')) {
    const f = path.join(UPLOAD_DIR, path.basename(url));
    fs.existsSync(f) && fs.unlink(f, () => {});
  } else if (USE_CLOUD && /res\.cloudinary\.com/.test(url)) {
    const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    if (m) {
      const rt = /\/video\//.test(url) ? 'video' : 'image';
      try { const r = await cloudinary.uploader.destroy(m[1], { resource_type: rt, invalidate: true }); console.log('[delete] cloud', m[1], r.result); }
      catch (e) { console.log('[delete] cloud failed', m[1], e.message); }
    }
  }
}
function markDeleted(d, url) {
  if (!url) return;
  d.deleted = (d.deleted || []).filter(u => u !== url); d.deleted.unshift(url);
  if (d.deleted.length > 1000) d.deleted.length = 1000;
}

// admin route
app.get('/admin', (req, res) => res.sendFile(path.join(ROOT, 'public', 'admin.html')));

app.use((err, req, res, next) => res.status(400).json({ error: err.message }));

async function syncCloudPhotos() {
  if (!USE_CLOUD) return;
  try {
    const d = load(); const have = new Set([...d.photos.map(p => p.image), ...d.videos.map(v => v.src), ...d.videos.map(v => v.thumb), d.profile.photo, ...(d.deleted || [])]);
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

(async () => { await restoreFromCloud(); })();
// Keep-alive self ping (Render free tier sleeps after 15 min idle)
const SELF_URL = process.env.RENDER_EXTERNAL_URL || process.env.SELF_URL;
if (SELF_URL) setInterval(() => fetch(SELF_URL + '/health').catch(() => {}), 10 * 60 * 1000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mahians Designs running on http://0.0.0.0:${PORT}`);
  console.log(`Admin panel: http://0.0.0.0:${PORT}/admin  (user: ${ADMIN_USER})`);
  console.log(`Storage: ${USE_CLOUD ? 'Cloudinary (persistent)' : 'local disk ' + UPLOAD_DIR}`);
});
