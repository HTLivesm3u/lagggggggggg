# 📦 Installation Guide for Music45

Complete step-by-step installation instructions for the Music45 TypeScript music streaming application.

## 📋 Table of Contents

- [System Requirements](#system-requirements)
- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Running the Application](#running-the-application)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Optional Configuration](#optional-configuration)
- [Next Steps](#next-steps)

---

## 💻 System Requirements

### Minimum Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, or Linux
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 500MB free space
- **Internet**: Stable broadband connection (required for streaming)
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+

### Development Requirements

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Text Editor**: VS Code, Sublime Text, or any code editor
- **Terminal**: Command Prompt, PowerShell, Terminal, or Bash

---

## 🔧 Prerequisites

### Step 1: Install Node.js

#### Windows

1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Choose the **LTS (Long Term Support)** version
3. Run the installer (.msi file)
4. Follow the installation wizard
5. ✅ Check "Automatically install necessary tools" option
6. Restart your computer after installation

#### macOS

**Option A: Using Official Installer**
1. Download from [nodejs.org](https://nodejs.org/)
2. Open the .pkg file
3. Follow the installation steps

**Option B: Using Homebrew**
```bash
brew install node
```

#### Linux (Ubuntu/Debian)

```bash
# Using NodeSource repository (recommended)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 2: Verify Installation

Open your terminal and run:

```bash
node --version
# Expected output: v18.x.x or higher

npm --version
# Expected output: 9.x.x or higher
```

✅ If both commands show version numbers, you're ready to proceed!

❌ If you see "command not found", restart your terminal or computer.

---

## 🚀 Installation Steps

### Step 1: Navigate to Project Directory

Open your terminal and navigate to the project folder:

**Windows (PowerShell):**
```powershell
cd "E:\Github\muisc45 2.0\lagggggggggg"
```

**Windows (Command Prompt):**
```cmd
cd /d "E:\Github\muisc45 2.0\lagggggggggg"
```

**macOS/Linux:**
```bash
cd "/path/to/lagggggggggg"
```

### Step 2: Install Dependencies

Run the following command to install all required packages:

```bash
npm install
```

**What happens during installation:**
- 📦 Downloads all dependencies (~150MB)
- 🔨 Compiles TypeScript definitions
- ⚙️ Sets up development tools
- ⏱️ Takes 1-3 minutes depending on internet speed

**Expected output:**
```
added 250 packages, and audited 251 packages in 45s

58 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

### Step 3: Verify Setup (Optional but Recommended)

Run the verification script to check if everything is set up correctly:

```bash
npm run verify
```

This script checks:
- ✅ Node.js and npm versions
- ✅ Required files exist
- ✅ Dependencies installed
- ✅ TypeScript compilation
- ✅ Port availability

---

## ▶️ Running the Application

### Development Mode

Start the development server with hot module replacement:

```bash
npm run dev
```

**Expected output:**
```
  VITE v5.0.10  ready in 234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.100:3000/
  ➜  press h to show help
```

The app will automatically open in your default browser at `http://localhost:3000`

🎉 **Success!** You should see the Music45 app loading.

### Other Commands

```bash
# Type checking (checks for TypeScript errors)
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Clean build artifacts
npm run clean
```

---

## ✅ Verification

### Quick Test Checklist

After the app opens in your browser, verify:

1. **✅ Home Page Loads** - You see "Good morning/afternoon/evening"
2. **✅ Albums Display** - Albums are visible in the home section
3. **✅ Search Works** - Click search tab, type a song name
4. **✅ Music Plays** - Click any song to start playback
5. **✅ Player Controls** - Play/pause button works
6. **✅ Settings Open** - Click settings icon (⚙️) to change quality

### Browser Console Check

Press **F12** to open Developer Tools and check:

- ❌ No red errors in Console tab
- ✅ "Lucide icons initialized" message appears
- ✅ "Music45 App initialized successfully!" message appears

---

## 🔧 Troubleshooting

### Issue: "command not found: npm"

**Solution:**
1. Restart your terminal/computer
2. Reinstall Node.js from [nodejs.org](https://nodejs.org/)
3. Check PATH environment variable

### Issue: "Port 3000 already in use"

**Solution A: Kill the process**
```bash
# Windows
npx kill-port 3000

# macOS/Linux
lsof -ti:3000 | xargs kill
```

**Solution B: Use different port**
```bash
npm run dev -- --port 3001
```

### Issue: "Cannot find module 'typescript'"

**Solution:**
```bash
# Clear cache and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript compilation errors

**Solution:**
```bash
# Check what's wrong
npm run type-check

# Most errors won't prevent the app from running in dev mode
# The app will still work with warnings
npm run dev
```

### Issue: "EACCES: permission denied"

**Solution (macOS/Linux):**
```bash
# Fix npm permissions
sudo chown -R $USER ~/.npm
sudo chown -R $USER /usr/local/lib/node_modules
```

**Solution (Windows):**
- Run terminal as Administrator
- Or reinstall Node.js with administrator privileges

### Issue: Module not found errors

**Solution:**
```bash
# Reinstall dependencies
npm ci
```

### Issue: Slow installation

**Solutions:**
```bash
# Use faster npm registry
npm install --registry=https://registry.npmjs.org/

# Or use yarn instead
npm install -g yarn
yarn install
```

### Issue: App opens but shows blank page

**Checklist:**
1. Check browser console (F12) for errors
2. Ensure you're using a modern browser
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try incognito/private mode
5. Check internet connection

### Issue: Music doesn't play

**Solutions:**
1. Check internet connection
2. Try a different song
3. Check browser console for API errors
4. Verify audio permissions in browser
5. Test with headphones plugged in

---

## ⚙️ Optional Configuration

### Add Your Logo

1. Create or download a 512x512px logo
2. Save it as `public/LOGO.jpg`
3. Refresh the app

### Change Default Port

Edit `vite.config.ts`:
```typescript
server: {
  port: 8080, // Change this
  // ...
}
```

### Customize Theme Colors

Edit `public/styles.css`:
```css
:root {
  --primary: hsl(210, 85%, 60%);  /* Blue */
  --accent: hsl(280, 85%, 65%);   /* Purple */
  /* Change these values */
}
```

### Configure Quality Settings

The app remembers your last quality setting. Available options:
- **Less Low**: 48 kbps (minimal data)
- **Low**: 96 kbps
- **Medium**: 160 kbps
- **High**: 320 kbps
- **Auto**: Best available

---

## 📱 Mobile Testing

### Test on Your Phone

1. **Find your computer's IP address:**

   **Windows:**
   ```powershell
   ipconfig
   # Look for "IPv4 Address"
   ```

   **macOS/Linux:**
   ```bash
   ifconfig | grep "inet "
   # Or
   ip addr show
   ```

2. **On your phone's browser, go to:**
   ```
   http://YOUR_IP_ADDRESS:3000
   ```
   Example: `http://192.168.1.100:3000`

3. **Important:** Both devices must be on the same WiFi network

### Install as PWA

1. Open the app in mobile browser
2. Tap browser menu (⋮)
3. Select "Add to Home Screen" or "Install App"
4. App icon will appear on your home screen

---

## 🌐 Building for Production

### Create Production Build

```bash
npm run build
```

Output will be in the `dist/` directory.

### Test Production Build Locally

```bash
npm run preview
```

Opens at `http://localhost:4173`

### Deploy to Hosting

**Vercel (Recommended):**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy
```

**GitHub Pages:**
1. Build the project: `npm run build`
2. Push `dist/` folder to `gh-pages` branch
3. Enable GitHub Pages in repository settings

---

## 🎓 Next Steps

Now that installation is complete:

1. 📖 **Read the docs**: Check out `README.md` for full documentation
2. 🚀 **Quick start**: See `QUICKSTART.md` for basic usage
3. 📊 **Project overview**: Read `PROJECT_SUMMARY.md` to understand structure
4. 🎨 **Customize**: Modify colors, add features, make it yours!
5. 🐛 **Report issues**: If you find bugs, open an issue on GitHub

---

## 📚 Additional Resources

- **TypeScript Docs**: https://www.typescriptlang.org/docs/
- **Vite Guide**: https://vitejs.dev/guide/
- **Node.js Docs**: https://nodejs.org/docs/
- **npm Docs**: https://docs.npmjs.com/

---

## 🆘 Still Having Issues?

If you're stuck:

1. **Check all steps** - Make sure you didn't skip anything
2. **Google the error** - Someone probably had the same issue
3. **Check GitHub Issues** - Look for similar problems
4. **Ask for help** - Open a new issue with:
   - Your OS and version
   - Node.js version (`node --version`)
   - Full error message
   - Steps to reproduce

---

## ✨ Installation Complete!

Congratulations! 🎉 You've successfully installed Music45.

**Quick Command Reference:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run verify   # Verify setup
```

Enjoy your music! 🎵🎶

---

**Last Updated**: 2024
**Version**: 2.0.0