/**
 * Daily Update Script for KasOS Documentation
 * Automatically updates changelog, version info, and statistics
 */

const fs = require('fs').promises;
const path = require('path');

class DailyUpdater {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.changelogPath = path.join(this.baseDir, 'CHANGELOG.md');
        this.statsPath = path.join(this.baseDir, 'stats.json');
        this.versionsPath = path.join(this.baseDir, 'partials', 'versions-releases.html');
    }

    async runDailyUpdate() {
        console.log('🌅 Running daily documentation update...');
        
        try {
            await this.updateStats();
            await this.checkForChanges();
            await this.updateVersionsSection();
            await this.generateSitemap();
            
            console.log('✅ Daily update completed successfully!');
        } catch (error) {
            console.error('❌ Daily update failed:', error.message);
        }
    }

    async updateStats() {
        console.log('📊 Updating documentation statistics...');
        
        const stats = {
            lastUpdated: new Date().toISOString(),
            totalSections: await this.countSections(),
            totalPages: await this.countPages(),
            lastCommit: await this.getLastCommit(),
            buildNumber: await this.incrementBuildNumber(),
            fileSize: await this.getDocumentationSize()
        };

        await fs.writeFile(this.statsPath, JSON.stringify(stats, null, 2));
        console.log('✓ Statistics updated');
    }

    async checkForChanges() {
        console.log('🔍 Checking for documentation changes...');
        
        // Check if any partials were modified in the last 24 hours
        const partialsDir = path.join(this.baseDir, 'partials');
        
        try {
            const files = await fs.readdir(partialsDir);
            const recentChanges = [];
            
            for (const file of files) {
                const filePath = path.join(partialsDir, file);
                const stats = await fs.stat(filePath);
                const hoursSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
                
                if (hoursSinceModified < 24) {
                    recentChanges.push({
                        file,
                        modified: stats.mtime.toISOString()
                    });
                }
            }
            
            if (recentChanges.length > 0) {
                console.log(`✓ Found ${recentChanges.length} recent changes`);
                await this.logChanges(recentChanges);
            } else {
                console.log('✓ No recent changes detected');
            }
        } catch (error) {
            console.warn('⚠️ Could not check for changes:', error.message);
        }
    }

    async updateVersionsSection() {
        console.log('📦 Updating versions section...');
        
        const versionInfo = await this.getVersionInfo();
        const versionsHTML = this.generateVersionsHTML(versionInfo);
        
        await fs.writeFile(this.versionsPath, versionsHTML);
        console.log('✓ Versions section updated');
    }

    async generateSitemap() {
        console.log('🗺️ Generating sitemap...');
        
        const sitemap = await this.buildSitemap();
        const sitemapPath = path.join(this.baseDir, 'sitemap.xml');
        
        await fs.writeFile(sitemapPath, sitemap);
        console.log('✓ Sitemap generated');
    }

    async countSections() {
        try {
            const partialsDir = path.join(this.baseDir, 'partials');
            const files = await fs.readdir(partialsDir);
            return files.filter(file => file.endsWith('.html')).length;
        } catch {
            return 0;
        }
    }

    async countPages() {
        // For now, documentation is single-page
        return 1;
    }

    async getLastCommit() {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            const { stdout } = await execAsync('git log -1 --format="%H %s"');
            return stdout.trim();
        } catch {
            return 'No git information available';
        }
    }

    async incrementBuildNumber() {
        try {
            const buildFile = path.join(this.baseDir, 'build-number.txt');
            let buildNumber = 1;
            
            try {
                const content = await fs.readFile(buildFile, 'utf8');
                buildNumber = parseInt(content.trim()) + 1;
            } catch {
                // File doesn't exist, start at 1
            }
            
            await fs.writeFile(buildFile, buildNumber.toString());
            return buildNumber;
        } catch {
            return 1;
        }
    }

    async getDocumentationSize() {
        try {
            const indexPath = path.join(this.baseDir, 'index.html');
            const stats = await fs.stat(indexPath);
            return `${(stats.size / 1024).toFixed(2)} KB`;
        } catch {
            return 'Unknown';
        }
    }

    async logChanges(changes) {
        const changelogEntry = `
## ${new Date().toISOString().split('T')[0]} - Daily Update

### Modified Files:
${changes.map(change => `- ${change.file} (${change.modified})`).join('\n')}

---
`;

        try {
            let existingChangelog = '';
            try {
                existingChangelog = await fs.readFile(this.changelogPath, 'utf8');
            } catch {
                existingChangelog = '# KasOS Documentation Changelog\n\n';
            }
            
            const updatedChangelog = existingChangelog.replace(
                '# KasOS Documentation Changelog\n\n',
                `# KasOS Documentation Changelog\n${changelogEntry}`
            );
            
            await fs.writeFile(this.changelogPath, updatedChangelog);
        } catch (error) {
            console.warn('⚠️ Could not update changelog:', error.message);
        }
    }

    async getVersionInfo() {
        return {
            current: '1.2.1',
            releases: [
                {
                    version: 'v1.2.1',
                    date: new Date().toISOString().split('T')[0],
                    highlights: [
                        'Enhanced documentation structure',
                        'Added modular build system',
                        'Improved daily update automation',
                        'Performance optimizations'
                    ]
                },
                {
                    version: 'v1.2.0',
                    date: '2025-07-01',
                    highlights: [
                        'Launched comprehensive documentation site',
                        'Enhanced security features',
                        'New app manager capabilities',
                        'UI/UX improvements'
                    ]
                },
                {
                    version: 'v1.1.0',
                    date: '2025-06-15',
                    highlights: [
                        'Integrated KasWallet for cryptocurrency management',
                        'Added multi-desktop support',
                        'General bug fixes and optimizations'
                    ]
                },
                {
                    version: 'v1.0.0',
                    date: '2025-05-01',
                    highlights: [
                        'Initial public release of KasOS',
                        'Core desktop environment and built-in apps',
                        'Window management and app system'
                    ]
                }
            ]
        };
    }

    generateVersionsHTML(versionInfo) {
        return `<section id="versions-releases">
    <h1>📋 Versions & Releases</h1>
    <p>Stay up to date with the latest KasOS enhancements and fixes as the project evolves.</p>
    
    <div class="version-highlight">
        <h2>Current Version: ${versionInfo.current}</h2>
        <p>Latest build: Build #<span id="build-number">Loading...</span> • Last updated: <span id="last-updated">Loading...</span></p>
    </div>
    
    <table class="versions-table">
        <thead>
            <tr>
                <th>Version</th>
                <th>Release Date</th>
                <th>Key Features</th>
            </tr>
        </thead>
        <tbody>
            ${versionInfo.releases.map(release => `
            <tr>
                <td><strong>${release.version}</strong></td>
                <td>${release.date}</td>
                <td>
                    <ul>
                        ${release.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
                    </ul>
                </td>
            </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="release-notes">
        <h3>📝 Full Release Notes</h3>
        <p>For detailed release notes and technical specifications, visit our <a href="https://github.com/kasos-io/kasos/releases" target="_blank">GitHub Releases</a> page.</p>
    </div>
    
    <div class="roadmap">
        <h3>🚀 Coming Soon</h3>
        <ul>
            <li>Enhanced AI integration features</li>
            <li>Advanced security protocols</li>
            <li>Extended cryptocurrency support</li>
            <li>Mobile-responsive interface</li>
            <li>Plugin marketplace</li>
        </ul>
    </div>
</section>`;
    }

    async buildSitemap() {
        const baseURL = 'https://docs.kasos.io';
        const lastMod = new Date().toISOString().split('T')[0];
        
        const sections = [
            'introduction', 'getting-started', 'desktop-environment', 'window-management',
            'application-system', 'keyboard-shortcuts', 'customization', 'troubleshooting',
            'text-editor', 'dev-tools', 'terminal', 'file-manager', 'kaswallet',
            'kasia-messenger', 'settings', 'app-development', 'api-reference',
            'advanced-development', 'testing-debugging', 'deployment', 'security',
            'architecture', 'crypto-integration', 'wasm-sandbox', 'ai-integration',
            'performance', 'contributing', 'versions-releases', 'support'
        ];

        const urls = sections.map(section => `
    <url>
        <loc>${baseURL}/#${section}</loc>
        <lastmod>${lastMod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`).join('');

        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseURL}/</loc>
        <lastmod>${lastMod}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>${urls}
</urlset>`;
    }
}

// CLI Interface
if (require.main === module) {
    const updater = new DailyUpdater();
    updater.runDailyUpdate();
}

module.exports = DailyUpdater;
