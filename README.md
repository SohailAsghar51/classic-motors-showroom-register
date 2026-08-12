# Classic Motors Showroom — Digital Register System

A simple, front-end only web app to digitize the **Classic Motors Showroom** motorcycle sale/purchase register (Chak 6-5 M.L Pipplan). Built with plain HTML, CSS, and JavaScript — no backend or database required.

## ✨ Features

- 🔐 **Login-protected access** (client-side gate)
- 🏠 **Dashboard** — stats, sales trend chart, payment status chart, recent records
- 📝 **Data Entry** — bilingual form (English + Urdu / Jameel Noori Nastaleeq) covering buyer, guarantor, witness, motorcycle, and payment details, plus an installment table
- 📂 **Records** — searchable, paginated list of all saved entries, with Edit (re-login required) and per-record PDF download
- 📊 **Reports & Analytics** — top models sold, sales vs. pending charts, full summary table
- 🖨️ **PDF Export** — generates a single-page, Urdu-only, register-style printable page
- 💾 **Local storage** — records save automatically in the browser
- ⬇ **Export / Import JSON** — manual backup and restore of all records

## 📁 Project Structure

```
classic-motors-app/
├── public/
│   ├── index.html      # Main application (protected)
│   ├── login.html       # Login page
│   ├── css/
│   │   └── style.css    # Shared styles
│   └── js/
│       ├── auth.js      # Login/session logic
│       └── app.js        # Records, charts, PDF logic
└── data/
    └── records.json     # Sample/seed data structure
```

## 🚀 Getting Started

1. Download or clone this repository.
2. Open `public/login.html` in a browser (or serve the `public` folder with any local static server, e.g. VS Code "Live Server").
3. Sign in with:
   - **Username:** `admin`
   - **Password:** `1122`

## ⚠️ Important Notes

- This is a **static, front-end-only app** — the login is a client-side access gate, **not** a secure server-side authentication system. Anyone with the source code can see the credentials.
- Records are stored in the browser's `localStorage`, scoped to that specific browser/device. Use the **Export / Backup JSON** button regularly to keep a permanent copy of your data.
- For real multi-user, multi-device syncing or genuine secure authentication, a backend (e.g. Node.js/PHP + a database) would be required.

## 🛠️ Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript
- [Chart.js](https://www.chartjs.org/) for dashboard charts
- Jameel Noori Nastaleeq font for Urdu print output

## 📄 License

Free to use and modify for Classic Motors Showroom's internal record-keeping.
