# Vasil Vassilev Portfolio

Public portfolio site for software development opportunities. The site is a small static frontend with two Vercel serverless functions for contact and resume email delivery.

## Stack

- HTML, CSS, and vanilla JavaScript
- Tailwind CSS build step
- Vercel serverless functions in `api/`
- Resend for outbound email

## Repository Contents

- `index.html`, `about.html`, `projects.html`, `contact.html`, `privacy-policy.html`: public pages
- `styles.css`, `input.css`, `tailwind.config.js`: styling source and generated CSS
- `main.js`: shared client-side interactions
- `api/contact.js`: contact form email endpoint
- `api/send-resume.js`: resume request email endpoint
- `resources/`: site images with public metadata stripped
- `Vasil Vassilev Resume.pdf`: resume served by the site

## Local Development

```bash
npm install
npm run build
npx serve .
```

The site can also be opened directly from `index.html`, but API routes require a Vercel-compatible local or deployed environment.

## Environment Variables

Set these in Vercel, not in the repository:

- `RESEND_API_KEY`: Resend API key for outbound email
- `RESUME_FROM_EMAIL`: verified sender address for Resend
- `RESUME_NOTIFY_EMAIL`: optional destination for contact and resume notifications
- `SITE_URL`: optional canonical site URL used in resume links

## Deployment

The repository is configured for Vercel through `vercel.json`.

```bash
npm run build
vercel
```

## Privacy Notes

The contact form and resume request form send email through the site backend. The repository should not contain `.env` files, local deployment state, API keys, tool output, screenshots, or unreviewed media metadata.
