// Main JavaScript functionality for Vasil Vassilev Portfolio
// Handles animations, interactions, and dynamic content

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initTypewriter();
    initScrollAnimations();
    initSkillsChart();
    initMobileMenu();
    initSmoothScroll();
    initProjectFilters();
    initContactForm();
    initResumeFunctions();
});

// Typewriter effect for hero section
function initTypewriter() {
    const typed = new Typed('#typed-name', {
        strings: ['Vasil Vassilev'],
        typeSpeed: 100,
        startDelay: 500,
        showCursor: true,
        cursorChar: '|',
        onComplete: function() {
            // Animate the rest of the hero content after name is typed
            anime({
                targets: '.hero-content p, .hero-content .flex, .hero-content .items-center',
                opacity: [0, 1],
                translateY: [20, 0],
                delay: anime.stagger(200),
                duration: 800,
                easing: 'easeOutQuart'
            });
        }
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
                if (children.length > 0) {
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
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    const option = {
        title: {
            text: 'Technical Skills Overview',
            left: 'center',
            textStyle: {
                fontSize: 18,
                fontWeight: 'bold',
                color: '#2C3E50'
            }
        },
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

// Project filtering (for projects page)
function initProjectFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-item');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter projects
            projectCards.forEach(card => {
                const categories = card.getAttribute('data-category').split(' ');
                if (filter === 'all' || categories.includes(filter)) {
                    card.style.display = 'block';
                    anime({
                        targets: card,
                        opacity: [0, 1],
                        scale: [0.8, 1],
                        duration: 400,
                        easing: 'easeOutQuart'
                    });
                } else {
                    anime({
                        targets: card,
                        opacity: [1, 0],
                        scale: [1, 0.8],
                        duration: 300,
                        easing: 'easeInQuart',
                        complete: function() {
                            card.style.display = 'none';
                        }
                    });
                }
            });
        });
    });
}

// Contact form functionality
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            // Simulate form submission (replace with actual endpoint)
            setTimeout(() => {
                showNotification('Message sent successfully!', 'success');
                contactForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
}

// Resume email and download functionality
function initResumeFunctions() {
    // Email resume functionality
    const emailResumeBtn = document.getElementById('emailResumeBtn');
    if (emailResumeBtn) {
        emailResumeBtn.addEventListener('click', function() {
            const recipient = prompt('Enter recipient email address:');
            if (recipient && isValidEmail(recipient)) {
                const subject = encodeURIComponent('Vasil Vassilev - Software Developer Resume');
                const body = encodeURIComponent(`Hi there,\n\nI wanted to share my resume with you. Please find it attached.\n\nBest regards,\nVasil Vassilev`);
                
                // Create mailto link with resume attachment
                const mailtoLink = `mailto:${recipient}?subject=${subject}&body=${body}`;
                window.location.href = mailtoLink;
                
                showNotification('Email client opened with resume attachment', 'info');
            } else if (recipient) {
                showNotification('Please enter a valid email address', 'error');
            }
        });
    }
    
    // Download resume functionality
    const downloadResumeBtns = document.querySelectorAll('[data-download-resume]');
    downloadResumeBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Track download
            gtag('event', 'resume_download', {
                event_category: 'engagement',
                event_label: 'resume_pdf'
            });
            
            // Trigger download
            const link = document.createElement('a');
            link.href = 'Vasil Vassilev Resume.pdf';
            link.download = 'Vasil_Vassilev_Resume.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('Resume downloaded successfully!', 'success');
        });
    });
}

// Utility Functions

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
    
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="flex-1">${message}</span>
            <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;
    
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

// Parallax effect for hero background
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.hero-bg');
    
    parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Add loading animation
window.addEventListener('load', function() {
    // Hide any loading screens
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.style.display = 'none';
    }
    
    // Animate page entrance
    anime({
        targets: 'body',
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutQuart'
    });
});

// Error handling for missing elements
window.addEventListener('error', function(e) {
    console.warn('Portfolio script error:', e.error);
    // Continue execution even if some features fail
});

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to scroll events
const debouncedScrollHandler = debounce(function() {
    // Scroll-based animations here
}, 16); // ~60fps

window.addEventListener('scroll', debouncedScrollHandler);