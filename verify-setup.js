#!/usr/bin/env node

/**
 * Music45 Setup Verification Script
 * Checks if your development environment is ready to run the app
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Verification results
let checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

console.log(`\n${colors.cyan}╔════════════════════════════════════════╗`);
console.log(`║   Music45 Setup Verification Script   ║`);
console.log(`╚════════════════════════════════════════╝${colors.reset}\n`);

// Helper functions
function pass(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
  checks.passed++;
}

function fail(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
  checks.failed++;
}

function warn(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
  checks.warnings++;
}

function info(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

function section(title) {
  console.log(`\n${colors.cyan}${title}${colors.reset}`);
  console.log('─'.repeat(title.length));
}

// Check Node.js version
section('Checking Node.js');
try {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

  if (majorVersion >= 18) {
    pass(`Node.js ${nodeVersion} (Required: >= 18.0.0)`);
  } else {
    fail(`Node.js ${nodeVersion} is too old. Required: >= 18.0.0`);
    info('  Download latest from: https://nodejs.org/');
  }
} catch (error) {
  fail('Could not determine Node.js version');
}

// Check npm version
section('Checking npm');
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
  const majorVersion = parseInt(npmVersion.split('.')[0]);

  if (majorVersion >= 9) {
    pass(`npm ${npmVersion} (Required: >= 9.0.0)`);
  } else {
    fail(`npm ${npmVersion} is too old. Required: >= 9.0.0`);
    info('  Update with: npm install -g npm@latest');
  }
} catch (error) {
  fail('npm not found or not accessible');
}

// Check for required files
section('Checking Required Files');
const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'index.html',
  'src/main.ts',
  'src/types/index.ts',
  'src/services/api.ts',
  'src/services/storage.ts',
  'src/services/lyrics.ts',
  'src/utils/helpers.ts',
  'public/styles.css',
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    pass(file);
  } else {
    fail(`Missing file: ${file}`);
  }
});

// Check for logo
if (fs.existsSync('public/LOGO.jpg') || fs.existsSync('public/LOGO.png')) {
  pass('Logo file found');
} else {
  warn('Logo file not found (public/LOGO.jpg)');
  info('  This is optional but recommended for branding');
}

// Check node_modules
section('Checking Dependencies');
if (fs.existsSync('node_modules')) {
  pass('node_modules directory exists');

  // Check for specific important packages
  const importantPackages = [
    'typescript',
    'vite',
  ];

  importantPackages.forEach(pkg => {
    const pkgPath = path.join('node_modules', pkg);
    if (fs.existsSync(pkgPath)) {
      pass(`Package installed: ${pkg}`);
    } else {
      fail(`Missing package: ${pkg}`);
      info('  Run: npm install');
    }
  });
} else {
  fail('node_modules directory not found');
  info('  Run: npm install');
}

// Check package.json scripts
section('Checking npm Scripts');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const requiredScripts = ['dev', 'build', 'preview'];

  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      pass(`Script available: npm run ${script}`);
    } else {
      fail(`Missing script: ${script}`);
    }
  });
} catch (error) {
  fail('Could not read package.json');
}

// Check TypeScript compilation
section('Checking TypeScript');
try {
  execSync('npx tsc --noEmit', { encoding: 'utf-8', stdio: 'pipe' });
  pass('TypeScript compilation successful (no errors)');
} catch (error) {
  const output = error.stdout || error.stderr || '';
  if (output.includes('error TS')) {
    const errorCount = (output.match(/error TS/g) || []).length;
    warn(`TypeScript has ${errorCount} error(s)`);
    info('  Run: npm run type-check');
    info('  You can still run the dev server, errors will show in browser');
  } else if (!fs.existsSync('node_modules/typescript')) {
    fail('TypeScript not installed');
    info('  Run: npm install');
  } else {
    warn('TypeScript check could not complete');
  }
}

// Check for port availability (optional)
section('Checking Port Availability');
try {
  const net = require('net');
  const server = net.createServer();

  server.listen(3000, () => {
    server.close();
    pass('Port 3000 is available');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      warn('Port 3000 is in use');
      info('  You can use a different port: npm run dev -- --port 3001');
    }
  });
} catch (error) {
  warn('Could not check port availability');
}

// Check internet connectivity (optional)
section('Checking Internet Connection');
const https = require('https');
https.get('https://www.google.com', (res) => {
  if (res.statusCode === 200) {
    pass('Internet connection available');
  } else {
    warn('Internet connection may be unstable');
    info('  Music45 requires internet to stream music');
  }
}).on('error', () => {
  warn('Could not verify internet connection');
  info('  Music45 requires internet to stream music');
});

// Final summary
setTimeout(() => {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════╗`);
  console.log(`║          Verification Summary          ║`);
  console.log(`╚════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.green}✓ Passed:   ${checks.passed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed:   ${checks.failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠ Warnings: ${checks.warnings}${colors.reset}\n`);

  if (checks.failed === 0) {
    console.log(`${colors.green}🎉 Your setup looks good! You can now run:${colors.reset}`);
    console.log(`${colors.cyan}   npm run dev${colors.reset}\n`);
  } else {
    console.log(`${colors.red}❌ Please fix the failed checks above before running the app.${colors.reset}\n`);
    process.exit(1);
  }

  if (checks.warnings > 0) {
    console.log(`${colors.yellow}⚠️  There are ${checks.warnings} warning(s). The app may still work.${colors.reset}\n`);
  }

  console.log(`${colors.blue}📚 For more help, see:${colors.reset}`);
  console.log(`   • README.md - Full documentation`);
  console.log(`   • QUICKSTART.md - Quick start guide`);
  console.log(`   • PROJECT_SUMMARY.md - Project overview\n`);
}, 1000);
