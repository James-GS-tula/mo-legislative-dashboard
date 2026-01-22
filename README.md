# MO Legislative Dashboard

Embeddable Missouri legislative dashboard powered by LegiScan.

## Setup

1) Install
```bash
npm i
```

2) Create `.env`:
- DATABASE_URL
- LEGISCAN_API_KEY
- STATE=MO
- CRON_SECRET

3) Prisma migrate:
```bash
npx prisma migrate dev
```

4) Run dev:
```bash
npm run dev
```

## Sync bills
Send a POST request:
`/api/cron/sync?secret=YOUR_CRON_SECRET`

## Embed in Square
```html
<iframe src="https://YOUR-APP/?embed=1" style="width:100%; height:1400px; border:0;" loading="lazy"></iframe>
```
