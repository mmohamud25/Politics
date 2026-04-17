# Somalia 2040

Personal political blog and community platform — politics.mmohamud.me

Built with React, Vite, and Supabase.

---

## Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (Postgres)
- **Deployment**: GitHub Pages / Vercel / Netlify

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/mmohamud25/somalia2040.git
cd somalia2040
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Run locally

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

---

## Admin Access

Visit the site and click the **Admin** button at the bottom right.

- **Email**: mohamedmohammud@gmail.com
- **Password**: stored locally in App.jsx — change before deploying

---

## Deploying to GitHub Pages

1. In `vite.config.js`, set `base` to your repo name: `/somalia2040/`
2. Run `npm run build`
3. Push the `dist` folder to the `gh-pages` branch

Or use the `gh-pages` npm package:

```bash
npm install --save-dev gh-pages
```

Add to `package.json` scripts:
```json
"deploy": "npm run build && gh-pages -d dist"
```

Then run:
```bash
npm run deploy
```

---

## Project Structure

```
somalia2040/
├── public/
├── src/
│   ├── App.jsx        # Main app with all pages and admin panel
│   ├── supabase.js    # Supabase client and all DB functions
│   └── main.jsx       # React entry point
├── .env               # Your Supabase credentials (not committed)
├── .env.example       # Template for credentials
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## Somalia 2040

*Learn. Grow. Lead.*
