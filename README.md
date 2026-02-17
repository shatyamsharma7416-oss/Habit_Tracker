# HabitFlow Setup Guide

## 📋 Files Included:
1. `index.html` - The web application
2. `server.js` - Node.js backend server
3. `data.json` - Data storage file (auto-created)
4. `package.json` - Dependencies file

## ✅ Prerequisites:
- Node.js installed on your computer (download from https://nodejs.org/)

## 🚀 Quick Start:

### Step 1: Install Dependencies
Open terminal/command prompt in your project folder and run:
```bash
npm install
```

This will install Express and CORS packages needed by the server.

### Step 2: Start the Server
In the same terminal, run:
```bash
node server.js
```

You should see:
```
✅ HabitFlow Server running at http://localhost:3000
📁 Data file: [path]/data.json
Open http://localhost:3000 in your browser
```

### Step 3: Open the App
Open your web browser and go to:
```
http://localhost:3000
```

## 🎯 How It Works:

### Data Flow:
```
User adds/updates habit
        ↓
Data saved to browser
        ↓
Every change synced to server
        ↓
Server automatically updates data.json
        ↓
Data persists permanently
```

### Auto-Save Features:
- ✅ **Immediate save** - When you add/update/delete a habit
- ✅ **Auto-sync every 30 seconds** - Continuous backup
- ✅ **Server-side storage** - data.json updates automatically
- ✅ **Fallback to localStorage** - Works offline if server is down

## 📂 Folder Structure:
```
your-project-folder/
├── index.html          (Open this in browser)
├── server.js           (Run: node server.js)
├── package.json        (Dependencies)
├── data.json           (Auto-created, stores all habits)
└── node_modules/       (Auto-created)
```

## 🔧 Stopping the Server:
Press `Ctrl + C` in the terminal running the server.

## 🌐 Accessing from Other Devices:
Instead of localhost, use your computer's IP address:
```
http://[your-computer-ip]:3000
```

Find your IP with:
- **Windows**: Type `ipconfig` in command prompt
- **Mac/Linux**: Type `ifconfig` or `hostname -I` in terminal

## 📁 Data Storage:
- **Location**: `data.json` (same folder as index.html)
- **Format**: JSON
- **Auto-updated**: Yes, every time you make changes
- **Backup**: Download data.json regularly to backup

## ⚠️ Troubleshooting:

### "Cannot find module 'express'"
Solution: Run `npm install` first

### "Port 3000 already in use"
Solution: Change PORT in server.js to another number (3001, 3002, etc.)

### "Failed to connect to server"
Solution: Make sure server.js is running with `node server.js`

### Data not saving
Solution: Check browser console (F12) for errors

## 🎉 Done!
Your habit tracker is now running with automatic JSON file storage!
