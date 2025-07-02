/**
 * KasOS Documentation Build System
 * Combines partials into the main documentation file
 * Supports automatic daily updates and modular content management
 */

const fs = require('fs').promises;
const path = require('path');

class DocumentationBuilder {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.partialsDir = path.join(this.baseDir, 'partials');
        this.outputFile = path.join(this.baseDir, 'index.html');
        this.templateFile = path.join(this.baseDir, 'template.html');
        
        // Section order for consistent building
        this.sectionOrder = [
            'introduction',
            'getting-started',
            'desktop-environment',
            'window-management',
            'application-system',
            'keyboard-shortcuts',
            'customization',
            'troubleshooting',
            'text-editor',
            'dev-tools',
            'terminal',
            'file-manager',
            'kaswallet',
            'kasia-messenger',
            'settings',
            'app-development',
            'api-reference',
            'advanced-development',
            'testing-debugging',
            'deployment',
            'security',
            'architecture',
            'crypto-integration',
            'wasm-sandbox',
            'ai-integration',
            'performance',
            'contributing',
            'versions-releases',
            'support'
        ];
    }

    async build() {
        console.log('🔧 Building KasOS Documentation...');
        
        try {
            // Read template
            const template = await this.readTemplate();
            
            // Build all sections
            const sectionsContent = await this.buildSections();
            
            // Combine template with sections
            const finalHTML = template.replace('{{SECTIONS_CONTENT}}', sectionsContent);
            
            // Write output file
            await fs.writeFile(this.outputFile, finalHTML, 'utf8');
            
            console.log('✅ Documentation built successfully!');
            console.log(`📄 Output: ${this.outputFile}`);
            
            // Generate stats
            await this.generateBuildStats();
            
        } catch (error) {
            console.error('❌ Build failed:', error.message);
            throw error;
        }
    }

    async readTemplate() {
        try {
            return await fs.readFile(this.templateFile, 'utf8');
        } catch (error) {
            console.log('📝 Template not found, using default...');
            return this.getDefaultTemplate();
        }
    }

    async buildSections() {
        let sectionsHTML = '';
        
        for (const sectionId of this.sectionOrder) {
            try {
                const sectionContent = await this.loadSection(sectionId);
                if (sectionContent) {
                    sectionsHTML += sectionContent + '\n\n';
                    console.log(`✓ Loaded section: ${sectionId}`);
                }
            } catch (error) {
                console.warn(`⚠️  Failed to load section ${sectionId}:`, error.message);
            }
        }
        
        return sectionsHTML;
    }

    async loadSection(sectionId) {
        const sectionPath = path.join(this.partialsDir, `${sectionId}.html`);
        
        try {
            const content = await fs.readFile(sectionPath, 'utf8');
            return content.trim();
        } catch (error) {
            // Section file doesn't exist, skip it
            return null;
        }
    }

    async generateBuildStats() {
        const stats = {
            buildTime: new Date().toISOString(),
            sectionsCount: this.sectionOrder.length,
            version: await this.getVersion(),
            size: await this.getFileSize(this.outputFile)
        };

        const statsPath = path.join(this.baseDir, 'build-stats.json');
        await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
        
        console.log(`📊 Build stats saved to ${statsPath}`);
    }

    async getVersion() {
        try {
            const packagePath = path.join(this.baseDir, '../../package.json');
            const package = JSON.parse(await fs.readFile(packagePath, 'utf8'));
            return package.version || '1.0.0';
        } catch {
            return '1.0.0';
        }
    }

    async getFileSize(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return `${(stats.size / 1024).toFixed(2)} KB`;
        } catch {
            return 'Unknown';
        }
    }

    getDefaultTemplate() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KasOS Documentation</title>
    <link rel="stylesheet" href="assets/docs.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
</head>
<body>
    <div class="documentation-container">
        <nav class="sidebar">
            <div class="logo">
                <img src="logo.jpg" alt="KasOS Logo">
                <h1>KasOS Docs</h1>
            </div>
            <ul class="nav-items">
                <!-- Navigation will be auto-generated -->
            </ul>
        </nav>
        <main class="content">
            {{SECTIONS_CONTENT}}
        </main>
    </div>
    <footer>
        <img src="logo.jpg" alt="KasOS Logo">
        <span>&copy; 2025 KasOS</span>
    </footer>
    <script src="assets/docs.js"></script>
</body>
</html>`;
    }

    // Utility method to extract sections from existing file
    async extractSections() {
        console.log('📤 Extracting sections from existing documentation...');
        
        try {
            const existingContent = await fs.readFile(this.outputFile, 'utf8');
            const sections = this.parseSections(existingContent);
            
            for (const [sectionId, content] of Object.entries(sections)) {
                const sectionPath = path.join(this.partialsDir, `${sectionId}.html`);
                await fs.writeFile(sectionPath, content, 'utf8');
                console.log(`✓ Extracted: ${sectionId}`);
            }
            
            console.log('✅ All sections extracted successfully!');
        } catch (error) {
            console.error('❌ Extraction failed:', error.message);
        }
    }

    parseSections(html) {
        const sections = {};
        const sectionRegex = /<section id="([^"]+)"[^>]*>(.*?)<\/section>/gs;
        let match;
        
        while ((match = sectionRegex.exec(html)) !== null) {
            const [, sectionId, content] = match;
            sections[sectionId] = `<section id="${sectionId}">\n${content.trim()}\n</section>`;
        }
        
        return sections;
    }
}

// CLI Interface
if (require.main === module) {
    const builder = new DocumentationBuilder();
    const command = process.argv[2];
    
    switch (command) {
        case 'build':
            builder.build();
            break;
        case 'extract':
            builder.extractSections();
            break;
        case 'watch':
            console.log('👀 Starting watch mode...');
            // TODO: Implement file watching for auto-rebuild
            break;
        default:
            console.log(`
🚀 KasOS Documentation Builder

Commands:
  build    - Build documentation from partials
  extract  - Extract sections from existing file to partials
  watch    - Watch for changes and auto-rebuild

Usage: node build-docs.js [command]
            `);
    }
}

module.exports = DocumentationBuilder;
