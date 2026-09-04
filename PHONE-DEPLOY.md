# 📱 Phone theke Deploy — Step by Step (Bangla)

Apnar laptop lagbe na. Phone er browser (Chrome) diye 3 ta account banaben,
tarpor ami baki shob kaj kore debo.

---

## 🅰️ GitHub — Code rakhar jaygay (FREE)

1. Chrome e jan → **https://github.com/signup**
2. Email, password, username diye account banan (email verify korun)
3. Ekhon **Token** banan (password NA — ei token ta amake diben):
   - Jan: **https://github.com/settings/tokens/new**
     (Chrome menu ⋮ → "Desktop site" on korle shohoj hoy)
   - **Note:** `mahians-deploy`
   - **Expiration:** 7 days
   - **Select scopes:** shudhu ✅ **repo** e tick din
   - Niche **Generate token** → `ghp_xxxxxxxx…` ekta code dekhabe → **copy korun**
4. Amake pathan: **GitHub username** + **oi token**

> Token ta 7 din por nijei expire hobe. Kaj sesh hole apni chaile
> https://github.com/settings/tokens theke Delete o korte parben.

---

## 🅱️ Cloudinary — Photo/Video rakhar jaygay (FREE 25GB)

Free hosting e server restart hole upload muche jay — tai photo/video
Cloudinary te thakbe, kokhono muchbe na.

1. Jan → **https://cloudinary.com/users/register_free**
2. Sign up korun (Google diye o para jay)
3. Login korar por **Dashboard** e jan → upore dekhaben:
   - **Cloud Name**
   - **API Key**
   - **API Secret** (👁 icon e click korle dekhabe)
   - Ba ekta line: `CLOUDINARY_URL=cloudinary://xxxx:yyyy@zzzz`
4. Ei **CLOUDINARY_URL** line ta (ba tinta value) amake pathan

---

## 🅲 Render — Website host (FREE)

1. Jan → **https://render.com** → **Get Started** → **Sign in with GitHub** (🅰️ er account)
2. GitHub authorize korun → Render dashboard e dhukben
3. Ekhane apnar ar kichu korar nai — ami GitHub e code push korle
   ami apnake bolbo Render e 3 ta click korte (New → Blueprint → Apply)
   othoba apni chaile Render **API Key** (Account Settings → API Keys) dile
   ami oitao kore debo.

---

## 🌐 FREE Domain

| Option | Ki paben | Kotha theke |
|---|---|---|
| ✅ **Render subdomain** | `mahiansdesigns.onrender.com` — puro free, SSL shoho, kichu korte hobe na | Auto |
| ✅ **is-a.dev** | `mahian.is-a.dev` — free, developer der jonno | https://github.com/is-a-dev/register (GitHub PR — ami kore dite pari) |
| ✅ **eu.org** | `mahiansdesigns.eu.org` — free, 1–4 shoptaho approval | https://nic.eu.org |
| ⚠️ Freenom (.tk/.ml) | Age free chilo, **ekhon bondho** — eṛiye cholun | — |
| 💰 **.com / .design** | `mahiansdesigns.com` ~৳1,200–1,500/bochor | Namecheap / Hostinger / ExonHost (BD, bKash) |

**Recommendation:** Ekhon **Render subdomain** diye shuru korun (free, ekhoni).
Pore client ashle `.com` kinun — ami 5 minute e connect kore debo.

---

## 📋 Amake ja pathaben (ek message e)

```
GitHub username: ________
GitHub token:    ghp_________________
CLOUDINARY_URL:  cloudinary://_____:_____@_____
Admin password (site er jonno ja rakhte chan): ________
```

Tarpor ami:
1. Code GitHub e push korbo ✅
2. Render e deploy config ready korbo ✅
3. Apnake final live link debo → `https://mahiansdesigns.onrender.com` 🎉
4. Admin: `https://mahiansdesigns.onrender.com/admin`

---

## ⚠️ Free plan e ekta jinish
Render free plan e 15 minute keu na dhukle site "ghumiye" jay —
prothom visitor er 30–50 second lagte pare load hote. Portfolio er jonno OK.
Pore chaile $7/mo Starter e always-on kora jay.
