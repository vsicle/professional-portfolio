const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return json(res, 405, { error: 'Method not allowed.' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESUME_FROM_EMAIL;
    const notifyEmail = process.env.RESUME_NOTIFY_EMAIL || 'vvassilev515@gmail.com';

    if (!resendApiKey || !fromEmail) {
        return json(res, 500, { error: 'Contact email service is not configured.' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const company = String(body.company || '').trim();
    const subject = String(body.subject || '').trim();
    const message = String(body.message || '').trim();

    if (!firstName || !lastName || !EMAIL_REGEX.test(email) || !subject || !message) {
        return json(res, 400, { error: 'Complete all required contact fields.' });
    }

    try {
        await sendEmail({
            apiKey: resendApiKey,
            from: fromEmail,
            to: notifyEmail,
            subject: `Portfolio contact: ${subject}`,
            replyTo: email,
            html: `
                <p>A new portfolio contact form message was submitted.</p>
                <ul>
                    <li><strong>Name:</strong> ${firstName} ${lastName}</li>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Company:</strong> ${company || 'N/A'}</li>
                    <li><strong>Subject:</strong> ${subject}</li>
                </ul>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `
        });

        return json(res, 200, { ok: true });
    } catch (error) {
        return json(res, 500, { error: 'Unable to send your message right now.' });
    }
};
