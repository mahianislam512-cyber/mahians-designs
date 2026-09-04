# 🚀 Mahians Designs — Run & Deploy Guide (Bangla)

---

## PART 1 — Nijer Computer e Run kora (Local)

### Step 1: Node.js install korun
1. https://nodejs.org e jan
2. **LTS** version download kore install korun (Next → Next → Finish)
3. Check korte: Command Prompt / Terminal khule likhun `node -v` → version dekhale OK

### Step 2: Project folder ta computer e nin
Workspace theke puro `mahians-designs` folder ta download kore
jekono jaygay rakhun, jemon: `D:\mahians-designs`

### Step 3: Run korun
Folder er bhitore giye Command Prompt khulun (address bar e `cmd` likhe Enter) ar likhun:

```
npm install
npm start
```

Dekhaben:
```
Mahians Designs running on http://0.0.0.0:8080
Admin panel: http://0.0.0.0:8080/admin
```

Browser e khulun:
- Website → http://localhost:8080
- Admin   → http://localhost:8080/admin  (admin / mahian123)

> Bondho korte: Ctrl + C

---

## PART 2 — Internet e Deploy (Sobai dekhte parbe)

Apnar site e **Node.js backend + file upload** ache, tai Netlify/GitHub Pages
(static hosting) e cholbe **na**. Nicher option gulo kaj korbe.

### ⭐ Option A: Render.com (Shobcheye shohoj, recommended)

**Age GitHub e code tulun:**
1. https://github.com e account banan
2. "New repository" → naam `mahians-designs` → Create
3. Computer e project folder e cmd khule:
   ```
   git init
   git add .
   git commit -m "Mahians Designs portfolio"
   git branch -M main
   git remote add origin https://github.com/APNAR-USERNAME/mahians-designs.git
   git push -u origin main
   ```
   (Git install na thakle: https://git-scm.com theke install korun)

**Ekhon Render e:**
1. https://render.com → GitHub diye Sign up
2. Dashboard → **New +** → **Blueprint**
3. Apnar `mahians-designs` repo select korun → Render `render.yaml` file ta nijei pore nibe
4. **Apply** click korun
5. 2–3 minute por apnar site live: `https://mahians-designs.onrender.com`

**Admin password pete:**
Render Dashboard → apnar service → **Environment** tab → `ADMIN_PASS` er value copy korun.
(Chaile edit kore nijer password boshan)

**Important:** `render.yaml` e **Starter plan ($7/mo)** deya ache karon
**persistent disk** lagbe — noile server restart hole apnar upload kora photo/video muche jabe.
Free plan e test korte paren, kintu upload gulo thakbe na.

---

### Option B: Railway.app

1. https://railway.app → GitHub diye login
2. **New Project** → **Deploy from GitHub repo** → `mahians-designs` select
3. Service e click → **Variables** tab → add korun:
   - `ADMIN_USER` = `mahian`
   - `ADMIN_PASS` = `apnar-shokto-password`
   - `DATA_DIR` = `/data`
4. **Settings** → **Volumes** → **Add Volume** → Mount path: `/data`
5. **Settings** → **Networking** → **Generate Domain**
6. Done! Link ta apnar live site.

Railway free trial dey, tarpor usage-based (~$5/mo).

---

### Option C: Nijer VPS (DigitalOcean / Hostinger / Contabo — $4–6/mo)

Ubuntu server e SSH kore:

```bash
# Node install
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# Project
cd /var/www
sudo git clone https://github.com/APNAR-USERNAME/mahians-designs.git
cd mahians-designs
sudo npm install

# Environment
sudo tee .env <<EOF
ADMIN_USER=mahian
ADMIN_PASS=apnar-shokto-password
PORT=8080
EOF

# PM2 diye 24/7 cholbe
sudo npm i -g pm2
pm2 start server.js --name mahians
pm2 save && pm2 startup
```

Nginx config (`/etc/nginx/sites-available/mahians`):
```nginx
server {
    listen 80;
    server_name apnardomain.com www.apnardomain.com;
    client_max_body_size 500M;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/mahians /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
# Free SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d apnardomain.com -d www.apnardomain.com
```

---

### Option D: Docker (jekono host e)

```bash
docker build -t mahians .
docker run -d -p 8080:8080 \
  -e ADMIN_USER=mahian -e ADMIN_PASS=shokto-password \
  -v mahians-data:/app/data \
  --name mahians mahians
```

---

## PART 3 — Custom Domain (mahiansdesigns.com)

1. Namecheap / GoDaddy / Hostinger theke domain kinun (~$10/year)
2. Render/Railway → Settings → **Custom Domain** → domain add korun
3. Ora ekta CNAME record dibe → apnar domain provider er DNS e boshan
4. 10–30 min por site apnar domain e cholbe, SSL (https) automatic

---

## PART 4 — Guruttopurno Kotha

| Bishoy | Kotha |
|---|---|
| 🔐 Password | Live korar age **obosshoi** `ADMIN_PASS` change korun |
| 💾 Backup | `data/` folder ta puro portfolio (photos, videos, text). Mashe ekbar download rakhun |
| 📦 File size | Video 500MB porjonto. Boro video hole YouTube e upload kore link din — hosting space bachbe |
| 🔄 Update | Code change korle `git push` → Render/Railway auto redeploy |
| 🌐 Admin URL | `apnarsite.com/admin` — ei link karo sathe share korben na |

---

## Environment Variables (shob host e same)

| Variable | Ki | Default |
|---|---|---|
| `ADMIN_USER` | Admin username | `admin` |
| `ADMIN_PASS` | Admin password | `mahian123` ⚠️ change korun |
| `PORT` | Server port | `8080` |
| `DATA_DIR` | Data + uploads folder | `./data` |

---

Kono step e atke gele — error message ta copy kore amake dekhaben. 🙂
