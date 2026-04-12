const RESUME_PATH = '/Vasil%20Vassilev%20Resume.pdf';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSiteUrl(req) {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const host = req.headers['x-forwarded-host'] || req.headers.host;

    if (process.env.SITE_URL) {
        return process.env.SITE_URL.replace(/\/$/, '');
    }

    return `${forwardedProto || 'https'}://${host}`;
}

function json(res, statusCode, payload) {
    res.status(statusCode).setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(payload));
}

async function sendEmail({ apiKey, from, to, subject, html, replyTo }) {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from,
            to,
            subject,
            html,
            reply_to: replyTo
        })
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(`Email provider error: ${details}`);
    }
}

function isTestingRestriction(error) {
    return /You can only send testing emails to your own email address/i.test(error.message);
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return json(res, 405, { error: 'Method not allowed.' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESUME_FROM_EMAIL;
    const notifyEmail = process.env.RESUME_NOTIFY_EMAIL || 'vvassilev515@gmail.com';

    if (!resendApiKey || !fromEmail) {
        return json(res, 500, { error: 'Resume email service is not configured.' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const recipient = String(body.email || '').trim().toLowerCase();

    if (!EMAIL_REGEX.test(recipient)) {
        return json(res, 400, { error: 'Enter a valid email address.' });
    }

    try {
        const siteUrl = getSiteUrl(req);
        const resumeUrl = `${siteUrl}${RESUME_PATH}`;
        const requestedAt = new Date().toISOString();

        await sendEmail({
            apiKey: resendApiKey,
            from: fromEmail,
            to: notifyEmail,
            subject: 'Resume requested from portfolio site',
            replyTo: recipient,
            html: `
                <p>A visitor requested the resume from the portfolio site.</p>
                <ul>
                    <li><strong>Email:</strong> ${recipient}</li>
                    <li><strong>Time (UTC):</strong> ${requestedAt}</li>
                    <li><strong>Resume URL:</strong> <a href="${resumeUrl}">${resumeUrl}</a></li>
                </ul>
            `
        });

        await sendEmail({
            apiKey: resendApiKey,
            from: fromEmail,
            to: recipient,
            subject: 'Vasil Vassilev Resume',
            replyTo: notifyEmail,
            html: `
                <p>Hi,</p>
                <p>Thanks for requesting my resume.</p>
                <p>You can view or download it here:</p>
                <p><a href="${resumeUrl}">${resumeUrl}</a></p>
                <p>Best,<br>Vasil Vassilev</p>
            `
        });
        return json(res, 200, { ok: true });
    } catch (error) {
        if (isTestingRestriction(error)) {
            return json(res, 200, {
                ok: true,
                delivery: 'download_only',
                resumeUrl: `${getSiteUrl(req)}${RESUME_PATH}`,
                message: 'Resume email delivery to external addresses is blocked until a sending domain is verified. The request was still logged.'
            });
        }

        return json(res, 500, { error: 'Unable to send the resume email right now.' });
    }
};
