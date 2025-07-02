/**
 * KasOS Documentation Interactive Features
 * Handles navigation, search, animations, and user experience enhancements
 */

class DocsApp {
    constructor() {
        this.currentSection = null;
        this.searchIndex = [];
        this.isInView = this.isInView.bind(this);
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupSearch();
        this.setupAnimations();
        this.setupCodeBlocks();
        this.setupMobileMenu();
        this.setupThemeToggle();
        this.setupScrollspy();
        this.setupKeyboardNavigation();
        
        // Initialize syntax highlighting
        if (typeof hljs !== 'undefined') {
            hljs.highlightAll();
        }

        console.log('🚀 KasOS Documentation initialized');
    }

    setupNavigation() {
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Update URL without jumping
                    history.pushState(null, null, anchor.getAttribute('href'));
                }
            });
        });

        // Handle back/forward navigation
        window.addEventListener('popstate', () => {
            if (location.hash) {
                const target = document.querySelector(location.hash);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    setupSearch() {
        // Build search index
        this.buildSearchIndex();

        // Create search UI
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <div style="position: relative;">
                <span class="search-icon">🔍</span>
                <input type="search" class="search-input" placeholder="Search documentation..." id="docs-search">
                <div class="search-results" id="search-results"></div>
            </div>
        `;

        // Insert search at the top of content
        const content = document.querySelector('main.content');
        if (content && content.firstChild) {
            content.insertBefore(searchContainer, content.firstChild);
        }

        // Setup search functionality
        const searchInput = document.getElementById('docs-search');
        const searchResults = document.getElementById('search-results');

        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value, searchResults);
                }, 300);
            });

            // Hide results when clicking outside
            document.addEventListener('click', (e) => {
                if (!searchContainer.contains(e.target)) {
                    searchResults.style.display = 'none';
                }
            });
        }
    }

    buildSearchIndex() {
        const sections = document.querySelectorAll('section[id]');
        sections.forEach(section => {
            const headings = section.querySelectorAll('h1, h2, h3, h4, h5, h6');
            const paragraphs = section.querySelectorAll('p');
            const lists = section.querySelectorAll('li');

            const content = [
                ...Array.from(headings).map(h => h.textContent),
                ...Array.from(paragraphs).map(p => p.textContent),
                ...Array.from(lists).map(li => li.textContent)
            ].join(' ');

            this.searchIndex.push({
                id: section.id,
                title: section.querySelector('h1, h2')?.textContent || section.id,
                content: content.toLowerCase(),
                element: section
            });
        });
    }

    performSearch(query, resultsContainer) {
        if (!query.trim()) {
            resultsContainer.style.display = 'none';
            return;
        }

        const results = this.searchIndex.filter(item => 
            item.content.includes(query.toLowerCase()) ||
            item.title.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);

        if (results.length > 0) {
            resultsContainer.innerHTML = results.map(result => `
                <div class="search-result-item" onclick="document.getElementById('${result.id}').scrollIntoView({behavior: 'smooth'})">
                    <strong>${result.title}</strong>
                    <p>${this.getSearchSnippet(result.content, query)}</p>
                </div>
            `).join('');
            resultsContainer.style.display = 'block';
        } else {
            resultsContainer.innerHTML = '<div class="search-no-results">No results found</div>';
            resultsContainer.style.display = 'block';
        }
    }

    getSearchSnippet(content, query) {
        const index = content.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return content.substring(0, 100) + '...';
        
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + query.length + 50);
        const snippet = content.substring(start, end);
        
        return (start > 0 ? '...' : '') + 
               snippet.replace(new RegExp(`(${query})`, 'gi'), '<mark>$1</mark>') +
               (end < content.length ? '...' : '');
    }

    setupAnimations() {
        // Intersection Observer for scroll animations
        const animatedElements = document.querySelectorAll('section, .feature-card, table');
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-on-scroll', 'visible');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            animatedElements.forEach(el => {
                el.classList.add('animate-on-scroll');
                observer.observe(el);
            });
        }

        // Add floating animation to logo
        const logo = document.querySelector('.sidebar .logo img');
        if (logo) {
            logo.classList.add('floating');
        }

        // Add glow effect to important elements
        const glowElements = document.querySelectorAll('.feature-card, .version-highlight');
        glowElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                el.classList.add('cyber-glow');
            });
            el.addEventListener('mouseleave', () => {
                el.classList.remove('cyber-glow');
            });
        });
    }

    setupCodeBlocks() {
        // Add copy buttons to code blocks
        document.querySelectorAll('pre').forEach(pre => {
            const codeBlock = pre.querySelector('code');
            if (!codeBlock) return;

            // Create wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block';
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            // Create header
            const header = document.createElement('div');
            header.className = 'code-block-header';
            
            const language = codeBlock.className.match(/language-(\w+)/)?.[1] || 'code';
            header.innerHTML = `
                <span>${language.toUpperCase()}</span>
                <button class="code-copy-btn" onclick="this.closest('.code-block').querySelector('code').textContent">
                    📋 Copy
                </button>
            `;
            
            wrapper.insertBefore(header, pre);

            // Setup copy functionality
            const copyBtn = header.querySelector('.code-copy-btn');
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                    copyBtn.textContent = '✅ Copied!';
                    setTimeout(() => {
                        copyBtn.innerHTML = '📋 Copy';
                    }, 2000);
                });
            });
        });
    }

    setupMobileMenu() {
        // Create mobile menu toggle if it doesn't exist
        if (window.innerWidth <= 768 && !document.querySelector('.mobile-nav-toggle')) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'mobile-nav-toggle';
            toggleBtn.innerHTML = '☰';
            toggleBtn.setAttribute('aria-label', 'Toggle navigation menu');
            document.body.appendChild(toggleBtn);

            const sidebar = document.querySelector('.sidebar');
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                toggleBtn.innerHTML = sidebar.classList.contains('open') ? '✕' : '☰';
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                    sidebar.classList.remove('open');
                    toggleBtn.innerHTML = '☰';
                }
            });
        }
    }

    setupThemeToggle() {
        // Add theme toggle functionality
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = '🌙';
        themeToggle.title = 'Toggle Dark/Light Mode';
        themeToggle.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1050;
            background: var(--accent-primary);
            color: var(--bg-primary);
            border: none;
            padding: 10px;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: var(--shadow-neon);
            transition: var(--transition-fast);
        `;

        document.body.appendChild(themeToggle);

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            themeToggle.innerHTML = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
            
            // Save preference
            localStorage.setItem('kasos-docs-theme', 
                document.body.classList.contains('light-mode') ? 'light' : 'dark');
        });

        // Load saved theme
        const savedTheme = localStorage.getItem('kasos-docs-theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            themeToggle.innerHTML = '☀️';
        }
    }

    setupScrollspy() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-items a[href^="#"]');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.currentSection = entry.target.id;
                    this.updateActiveNavItem();
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '-80px 0px -80px 0px'
        });

        sections.forEach(section => observer.observe(section));
    }

    updateActiveNavItem() {
        const navLinks = document.querySelectorAll('.nav-items a[href^="#"]');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + this.currentSection) {
                link.classList.add('active');
            }
        });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('docs-search');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Escape to close search results
            if (e.key === 'Escape') {
                const searchResults = document.getElementById('search-results');
                if (searchResults) {
                    searchResults.style.display = 'none';
                }
            }

            // Navigate sections with arrow keys when focused
            if (e.target.matches('.nav-items a')) {
                const navItems = Array.from(document.querySelectorAll('.nav-items a'));
                const currentIndex = navItems.indexOf(e.target);

                if (e.key === 'ArrowDown' && currentIndex < navItems.length - 1) {
                    e.preventDefault();
                    navItems[currentIndex + 1].focus();
                } else if (e.key === 'ArrowUp' && currentIndex > 0) {
                    e.preventDefault();
                    navItems[currentIndex - 1].focus();
                }
            }
        });
    }

    isInView(element) {
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight;
    }

    // Public API for external scripts
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }

    updateBuildInfo() {
        // Update build information dynamically
        fetch('./build-stats.json')
            .then(response => response.json())
            .then(stats => {
                const buildNumber = document.getElementById('build-number');
                const lastUpdated = document.getElementById('last-updated');
                
                if (buildNumber) buildNumber.textContent = stats.buildNumber || 'N/A';
                if (lastUpdated) lastUpdated.textContent = new Date(stats.lastUpdated).toLocaleDateString() || 'N/A';
            })
            .catch(() => {
                console.log('Build stats not available');
            });
    }
}

// Add search result styles
const searchStyles = `
    .search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--bg-secondary);
        border: 1px solid var(--accent-primary);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-intense);
        max-height: 400px;
        overflow-y: auto;
        z-index: var(--z-dropdown);
        display: none;
    }
    
    .search-result-item {
        padding: var(--space-md);
        border-bottom: 1px solid var(--border-subtle);
        cursor: pointer;
        transition: var(--transition-fast);
    }
    
    .search-result-item:hover {
        background: var(--bg-tertiary);
    }
    
    .search-result-item strong {
        color: var(--accent-primary);
        display: block;
        margin-bottom: var(--space-xs);
    }
    
    .search-result-item p {
        margin: 0;
        font-size: 0.9rem;
        color: var(--text-muted);
    }
    
    .search-no-results {
        padding: var(--space-md);
        text-align: center;
        color: var(--text-muted);
    }
    
    mark {
        background: var(--accent-primary);
        color: var(--bg-primary);
        padding: 1px 2px;
        border-radius: 2px;
    }
`;

// Inject search styles
const styleSheet = document.createElement('style');
styleSheet.textContent = searchStyles;
document.head.appendChild(styleSheet);

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.docsApp = new DocsApp();
    });
} else {
    window.docsApp = new DocsApp();
}

// Export for external use
window.KasOSDocs = DocsApp;
