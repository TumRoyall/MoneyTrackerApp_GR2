# 🚂 Railway Deployment Guide — MoneyTracker Backend

This guide walks you through deploying the Spring Boot backend to Railway from zero.

> **Prerequisites**
> - A GitHub account (your code must be in a GitHub repo)
> - A Railway account (sign up at https://railway.app — use GitHub login)
> - A domain you own (optional, can use the free `*.up.railway.app` subdomain first)

---

## 1. Push the code to GitHub

If not already:

```bash
git init
git add .
git commit -m "prepare for railway deploy"
git branch -M main
git remote add origin https://github.com/<your-user>/MoneyTrackerApp_GR2.git
git push -u origin main
```

---

## 2. Create a new Railway project

1. Go to https://railway.app/new
2. Click **Deploy from GitHub repo**
3. Select this repository
4. Railway will scan and find `be_money_tracker/Dockerfile` — but you need to set the **Root Directory** to `be_money_tracker`

### 2.1 Configure Root Directory

- Click the service card → **Settings** → **Source** → **Root Directory** = `be_money_tracker`
- Railway will then auto-detect the `Dockerfile` in that folder

---

## 3. Add a MySQL database

1. In the same project, click **+ New** → **Database** → **MySQL**
2. Wait for it to provision (~30s)
3. Click the MySQL service → **Variables** — you'll see auto-generated vars:
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`
4. These are automatically shared with the backend service if both are in the same project. Verify by clicking the backend service → **Variables** → you should see the same `MYSQL*` vars (Railway shares them automatically when both services are in the same project).

If they don't appear, add them manually as **Reference Variables** pointing to the MySQL service.

---

## 4. Set environment variables on the backend service

Click your backend service → **Variables** → **+ New Variable** and add these one by one:

| Variable | Value | Notes |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` | Forces the prod profile |
| `JWT_SECRET` | *(generate below)* | **REQUIRED** — replace dev secret |
| `MAIL_USER` | `nguyenkimngoctum@gmail.com` | Your Gmail for sending mail |
| `MAIL_PASSWORD` | `zoqs imtt nijw dtqp` | Gmail app password (already in code) |
| `AI_GEMINI_APIKEY` | *(your Gemini key)* | Optional, AI features |
| `AI_GEMINI_MOCK` | `false` | Set `true` to disable real Gemini calls |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:8081` | Comma-separated. Add your web admin domain later if needed |

### Generate a new JWT_SECRET

Run locally:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

Or in PowerShell:

```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Use the output as `JWT_SECRET`. **Do not use the dev secret `TUMROYALHELLOWORLD...` in production.**

### Share MySQL vars with backend

If Railway did NOT auto-share them, click **+ New Variable** → **New Reference** → pick the MySQL service, and reference each `MYSQL*` var one by one.

---

## 5. Deploy

1. Click **Deploy** (or it auto-deploys when you push to GitHub)
2. Watch **Build Logs** — first build takes ~5-8 min (downloading Maven deps, building the image)
3. Once running, Railway gives you a public URL like `https://moneytracker-be-production.up.railway.app`

### 5.1 Test it

```bash
curl https://moneytracker-be-production.up.railway.app/actuator/health
# Should return: {"status":"UP"}
```

---

## 6. Add a custom domain (optional but recommended)

1. In Railway → backend service → **Settings** → **Networking** → **Custom Domain**
2. Add `api.yourdomain.com`
3. Railway shows a CNAME target like `xxx.up.railway.app`
4. Go to your domain registrar (Namecheap / Cloudflare / etc.) → DNS settings:
   - Add a **CNAME** record:
     - Host: `api`
     - Target: `<xxx>.up.railway.app` (the value Railway shows)
     - TTL: Auto
5. Wait 1-5 minutes for SSL to provision
6. Your backend is now live at `https://api.yourdomain.com`

### Cheap domain registrars

| Registrar | Price (.com) | Notes |
|---|---|---|
| Cloudflare | ~$10/yr | At-cost pricing, no markup, free DNS |
| Namecheap | ~$9/yr | Free WHOIS privacy first year |
| Porkbun | ~$9/yr | Cheap, clean UI |

> 💡 You can use a `.xyz` or `.site` domain for ~$1-2/yr if cost matters more than brand.

---

## 7. Update the mobile app

In `app_moneytracker/src/core/config/env.ts`:

```ts
export const ENV = {
  apiBaseUrl: 'https://api.yourdomain.com', // <-- your Railway URL
  // ...rest
};
```

Then rebuild the APK:

```bash
cd app_moneytracker
eas build --platform android --profile preview
```

Or trigger from Expo dashboard. Users download the new APK and the app now hits the real server.

---

## 8. Ongoing: pushing updates

```bash
# Edit code as usual
git add .
git commit -m "fix something"
git push
# → Railway auto-rebuilds and redeploys in ~3-5 min
# → Users don't need to do anything
```

---

## 💸 Cost estimate

| Item | Cost/month |
|---|---|
| Backend service (Java, ~512MB RAM) | $3-5 |
| MySQL plugin | $1-2 |
| Bandwidth | <$1 |
| **Total** | **$4-8/mo** |

New Railway accounts get a **$5 free trial** — your first month is effectively free.

---

## 🆘 Troubleshooting

### "Build failed: could not find Dockerfile"
→ Check **Settings → Source → Root Directory** is set to `be_money_tracker`.

### "401 / 403 from API"
→ JWT_SECRET mismatch. The first time the app starts, it generates tokens with the secret Railway has. If you change `JWT_SECRET` after users already logged in, all their sessions invalidate.

### "Communications link failure" to MySQL
→ MySQL vars not shared. Add them as Reference Variables on the backend service.

### "Port 8080 already in use" inside container
→ Don't hardcode port. The `Dockerfile` and `railway.json` already use `${PORT}`.

### Emails not sending
→ Gmail may block new IPs. You may need to:
1. Enable "Less secure app access" (deprecated, won't work)
2. Or use a dedicated transactional mail service (Resend, SendGrid free tier)

---

## 📋 Checklist before going live

- [ ] JWT_SECRET changed from dev value
- [ ] CORS configured for your web domain (if any)
- [ ] MySQL backups enabled (Railway → MySQL service → Backups)
- [ ] Custom domain + SSL working
- [ ] Mobile `env.ts` points to new domain
- [ ] New APK built and tested on a real device
