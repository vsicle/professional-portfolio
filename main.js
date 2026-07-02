// Portfolio interactions — dependency-free.
// Loaded with defer by index.html and contact.html.

(function () {
    'use strict';

    var CONTACT_EMAIL = 'vvassilev515@gmail.com';

    // Scroll reveal
    (function initReveal() {
        var els = document.querySelectorAll('.reveal');
        if (!els.length) return;

        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce || !('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }

        var observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        els.forEach(function (el) { observer.observe(el); });
    })();

    // Contact form
    (function initContactForm() {
        var form = document.getElementById('contactForm');
        if (!form) return;

        var status = form.querySelector('[role="status"]');
        var button = form.querySelector('button[type="submit"]');

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            var data = Object.fromEntries(new FormData(form));
            var label = button ? button.textContent : '';

            if (button) {
                button.disabled = true;
                button.textContent = 'Sending…';
            }
            if (status) status.textContent = '';

            try {
                var response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        company: data.company,
                        subject: data.subject,
                        message: data.message
                    })
                });

                var payload = await response.json().catch(function () { return {}; });

                if (!response.ok) {
                    throw new Error(payload.error || 'Message delivery failed.');
                }

                form.reset();
                if (status) status.textContent = 'Message sent. I will get back to you soon.';
            } catch (error) {
                if (status) status.textContent = error.message || 'Unable to send your message right now.';
            } finally {
                if (button) {
                    button.disabled = false;
                    button.textContent = label;
                }
            }
        });
    })();

    // Copy-email affordance
    (function initCopyEmail() {
        var triggers = document.querySelectorAll('[data-copy-email]');
        if (!triggers.length) return;

        triggers.forEach(function (el) {
            el.addEventListener('click', async function (e) {
                e.preventDefault();

                var email = el.getAttribute('data-copy-email') || CONTACT_EMAIL;
                var label = el.textContent;

                function swap() {
                    el.textContent = 'Copied';
                    setTimeout(function () { el.textContent = label; }, 1600);
                }

                try {
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(email);
                        swap();
                    } else {
                        throw new Error('clipboard unavailable');
                    }
                } catch (err) {
                    window.location.href = 'mailto:' + email;
                }
            });
        });
    })();
})();
