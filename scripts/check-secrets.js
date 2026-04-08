const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const ignoredDirs = new Set(['.git', '.vercel', 'bin', 'node_modules']);
const textExtensions = new Set([
    '.css', '.env', '.example', '.gitignore', '.html', '.js', '.json',
    '.md', '.mjs', '.txt', '.toml', '.xml', '.yml', '.yaml'
]);

const detectors = [
    {
        name: 'Google API key',
        pattern: /AIza[0-9A-Za-z\-_]{35}/g
    },
    {
        name: 'Quoted JWT-like token',
        pattern: /['"`]eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+['"`]/g
    },
    {
        name: 'GitHub token',
        pattern: /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/g
    },
    {
        name: 'Slack token',
        pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g
    },
    {
        name: 'SendGrid token',
        pattern: /\bSG\.[A-Za-z0-9_\-]{16,}\.[A-Za-z0-9_\-]{16,}\b/g
    },
    {
        name: 'Private key block',
        pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g
    }
];

const findings = [];

walk(rootDir);

if (findings.length > 0) {
    console.error('Potential secrets detected:\n');
    findings.forEach(finding => {
        console.error(`${finding.file}:${finding.line}  ${finding.name}`);
    });
    process.exit(1);
}

console.log('No potential secrets detected.');

function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(rootDir, fullPath);

        if (entry.isDirectory()) {
            if (!ignoredDirs.has(entry.name)) {
                walk(fullPath);
            }
            continue;
        }

        if (!shouldScanFile(entry.name)) {
            continue;
        }

        const content = fs.readFileSync(fullPath, 'utf8');
        scanFile(relativePath, content);
    }
}

function shouldScanFile(fileName) {
    const extension = path.extname(fileName).toLowerCase();
    return textExtensions.has(extension) || fileName === '.env.example';
}

function scanFile(relativePath, content) {
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
        if (isAllowedExample(relativePath, line)) {
            return;
        }

        detectors.forEach(detector => {
            detector.pattern.lastIndex = 0;
            if (detector.pattern.test(line)) {
                findings.push({
                    file: relativePath,
                    line: index + 1,
                    name: detector.name
                });
            }
        });
    });
}

function isAllowedExample(relativePath, line) {
    if (relativePath === '.env.example') {
        return true;
    }

    return (
        line.includes('YOUR_') ||
        line.includes('your_') ||
        line.includes('your-project') ||
        line.includes('your_google_ai_api_key') ||
        line.includes('your_supabase_anon_key') ||
        line.includes('SECURE_PROXY_ENDPOINT')
    );
}
