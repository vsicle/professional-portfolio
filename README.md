# Vasil Vassilev Portfolio

Public portfolio site for software development opportunities. The site is a single-page static frontend with one Vercel serverless function for contact form email delivery.

## Stack

- HTML, CSS, and vanilla JavaScript
- Tailwind CSS build step
- Three.js hero animation, lazy-loaded on capable browsers
- Vercel serverless function in `api/`
- Resend for outbound email

## Repository Contents

- `index.html`: single-page site (hero, selected work, climbing, footer)
- `contact.html`: contact form page
- `privacy-policy.html`: privacy policy
- `styles.css`, `input.css`, `tailwind.config.js`: styling source and generated CSS
- `main.js`: shared client-side interactions
- `js/terrain.js`: three.js terrain hero, lazy-loaded from `index.html` with a static SVG fallback for reduced-motion and non-WebGL browsers
- `api/contact.js`: contact form email endpoint
- `resources/`: site images with public metadata stripped
- `Vasil_Vassilev_Resume.pdf`: resume served directly by the site

## Local Development

```bash
npm install
npm run build
npx serve .
```

The site can also be opened directly from `index.html`, but the contact API route requires a Vercel-compatible local or deployed environment.

## Environment Variables

Set these in Vercel, not in the repository:

- `RESEND_API_KEY`: Resend API key for outbound email
- `RESUME_FROM_EMAIL`: verified Resend sender address used as the "from" on contact emails
- `RESUME_NOTIFY_EMAIL`: recipient address for contact form notifications (optional; defaults to the site owner's address)

## Deployment

The repository is configured for Vercel through `vercel.json`.

```bash
npm run build
vercel
```

## Privacy Notes

The contact form sends email through the site backend. The repository should not contain `.env` files, local deployment state, API keys, tool output, screenshots, or unreviewed media metadata.
