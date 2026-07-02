// Main JavaScript functionality for Vasil Vassilev Portfolio
// Handles animations, interactions, and dynamic content

document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('js-animations');

    // Initialize all functionality
    initTypewriter();
    initScrollAnimations();
    initSkillsChart();
    initMobileMenu();
    initSmoothScroll();
    initContactForm();
    initResumeFunctions();
    initCopyEmailLinks();
});

const RESUME_FILE_PATH = 'Vasil_Vassilev_Resume.pdf';
const CONTACT_EMAIL = 'vvassilev515@gmail.com';

// Typewriter effect for hero section
function initTypewriter() {
    const typedTarget = document.querySelector('#typed-name');
    if (!typedTarget || typeof Typed !== 'function') {
        return;
    }

    new Typed('#typed-name', {
        strings: ['Vasil Vassilev'],
        typeSpeed: 50,
        startDelay: 500,
        showCursor: true,
        cursorChar: '|',
    });
}

// Scroll-triggered animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                
                // Add staggered animation for child elements
                const children = entry.target.querySelectorAll('.project-card, .bg-white');
                if (children.length > 0 && typeof anime === 'function') {
                    anime({
                        targets: children,
                        opacity: [0, 1],
                        translateY: [30, 0],
                        delay: anime.stagger(100),
                        duration: 600,
                        easing: 'easeOutQuart'
                    });
                }
            }
        });
    }, observerOptions);

    // Observe all fade-in-up elements
    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });
}

// Skills radar chart using ECharts
function initSkillsChart() {
    const chartDom = document.getElementById('skillsChart');
    if (!chartDom || typeof echarts === 'undefined') return;
    
    const myChart = echarts.init(chartDom);
    
    // Title is intentionally omitted here because the page already renders an H2 above
    // the chart. Including the ECharts title caused a duplicate label and visual overlap
    // with the document heading on some viewports.
    const option = {
        tooltip: {
            trigger: 'item'
        },
        radar: {
            indicator: [
                { name: 'C#/C++', max: 100 },
                { name: 'Python', max: 100 },
                { name: 'Java', max: 100 },
                { name: 'Web Dev', max: 100 },
                { name: 'Security', max: 100 },
                { name: 'Databases', max: 100 },
                { name: 'Linux/CLI', max: 100 },
                { name: 'Problem Solving', max: 100 }
            ],
            shape: 'polygon',
            splitNumber: 4,
            axisName: {
                color: '#7F8C8D',
                fontSize: 12
            },
            splitLine: {
                lineStyle: {
                    color: '#E5E7EB'
                }
            },
            splitArea: {
                show: false
            }
        },
        series: [{
            name: 'Skills',
            type: 'radar',
            data: [{
                value: [90, 85, 80, 88, 82, 85, 90, 95],
                name: 'Current Level',
                areaStyle: {
                    color: 'rgba(183, 71, 42, 0.2)'
                },
                lineStyle: {
                    color: '#B7472A',
                    width: 2
                },
                itemStyle: {
                    color: '#B7472A'
                }
            }],
            animationDuration: 2000,
            animationEasing: 'cubicOut'
        }]
    };
    
    myChart.setOption(option);
    
    // Responsive chart
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
        
        // Close mobile menu when clicking on a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('hidden');
            });
        });
    }
}

// Smooth scroll for navigation links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed nav
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Contact form functionality
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        company: data.company,
                        subject: formatSubject(data.subject),
                        message: data.message
                    })
                });

                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(payload.error || 'Message delivery failed.');
                }

                this.reset();
                showNotification('Message sent successfully.', 'success');
            } catch (error) {
                showNotification(error.message || 'Unable to send your message right now.', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// Resume email and download functionality
function initResumeFunctions() {
    const resumeRequestForm = document.getElementById('resumeRequestForm');
    if (resumeRequestForm) {
        resumeRequestForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitBtn = this.querySelector('button[type="submit"]');
            const emailInput = this.querySelector('input[name="email"]');
            const originalText = submitBtn.textContent;

            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/send-resume', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: emailInput.value.trim()
                    })
                });

                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(payload.error || 'Resume request failed.');
                }

                this.reset();
                if (payload.delivery === 'download_only' && payload.resumeUrl) {
                    window.open(payload.resumeUrl, '_blank', 'noopener');
                    showNotification('Email delivery is limited until the sending domain is verified. The resume opened directly, and the request was logged.', 'warning');
                } else {
                    showNotification('Resume email sent successfully.', 'success');
                }
            } catch (error) {
                showNotification(error.message || 'Unable to send resume right now.', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Download resume functionality
    const downloadResumeBtns = document.querySelectorAll('[data-download-resume]');
    downloadResumeBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (typeof gtag === 'function') {
                gtag('event', 'resume_download', {
                    event_category: 'engagement',
                    event_label: 'resume_pdf'
                });
            }

            const link = document.createElement('a');
            link.href = getResumeUrl();
            link.download = 'Vasil_Vassilev_Resume.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('Resume downloaded successfully!', 'success');
        });
    });
}

function initCopyEmailLinks() {
    document.querySelectorAll('[data-copy-email]').forEach(link => {
        link.addEventListener('click', async function(e) {
            e.preventDefault();

            const email = this.getAttribute('data-copy-email') || CONTACT_EMAIL;

            try {
                await copyTextToClipboard(email);
                showNotification('Email address copied to clipboard.', 'success');
            } catch {
                showNotification(`Copy failed. Email address: ${email}`, 'error');
            }
        });
    });
}

// Utility Functions

function getResumeUrl() {
    return new URL(encodeURI(RESUME_FILE_PATH), window.location.href).href;
}

async function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const copied = document.execCommand('copy');
    textarea.remove();

    if (!copied) {
        throw new Error('Clipboard unavailable.');
    }
}

function formatSubject(subject) {
    const labels = {
        'job-opportunity': 'Job Opportunity',
        'freelance-project': 'Freelance Project',
        collaboration: 'Collaboration',
        'general-inquiry': 'General Inquiry'
    };

    return labels[subject] || 'Portfolio Inquiry';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform translate-x-full transition-transform duration-300`;
    
    // Set notification style based on type
    switch(type) {
        case 'success':
            notification.classList.add('bg-green-500', 'text-white');
            break;
        case 'error':
            notification.classList.add('bg-red-500', 'text-white');
            break;
        case 'warning':
            notification.classList.add('bg-yellow-500', 'text-white');
            break;
        default:
            notification.classList.add('bg-blue-500', 'text-white');
    }
    
    const content = document.createElement('div');
    content.className = 'flex items-center';

    const messageElement = document.createElement('span');
    messageElement.className = 'flex-1';
    messageElement.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'ml-4 text-white hover:text-gray-200';
    closeButton.setAttribute('aria-label', 'Dismiss notification');
    closeButton.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
    `;
    closeButton.addEventListener('click', () => notification.remove());

    content.append(messageElement, closeButton);
    notification.appendChild(content);
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Parallax effect for hero background (optimized)
// Instead of moving the whole `.hero-bg` (which triggers layout and can cause overlap and jank),
// we update a CSS variable used by the pseudo-element. This keeps layout stable and leverages
// the compositor for smooth transforms.
(function() {
    const hero = document.querySelector('.hero-bg');
    if (!hero) return;

    let latestScrollY = 0;
    let ticking = false;
    const speed = 0.25; // gentle parallax

    function onScroll() {
        latestScrollY = window.pageYOffset || document.documentElement.scrollTop;
        requestTick();
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }

    function update() {
        const offset = Math.round(latestScrollY * speed);
        // set CSS variable on the hero element; used by the ::before transform
        hero.style.setProperty('--parallax', offset + 'px');
        ticking = false;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    // update once in case user isn't scrolling but page loads scrolled
    update();
})();

// Add loading animation
window.addEventListener('load', function() {
    // Hide any loading screens
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.style.display = 'none';
    }
    
    // Animate page entrance
    if (typeof anime === 'function') {
        anime({
            targets: 'body',
            opacity: [0, 1],
            duration: 500,
            easing: 'easeOutQuart'
        });
    }
});
