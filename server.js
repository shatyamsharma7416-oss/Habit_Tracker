const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Path to data.json file
const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize data.json if it doesn't exist
function initializeDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ habits: [] }, null, 2));
        console.log('Created data.json file');
    }
}

// GET all habits
app.get('/api/habits', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(data);
        res.json(parsed.habits || []);
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// POST save all habits
app.post('/api/habits', (req, res) => {
    try {
        const habits = req.body;
        const dataToSave = { habits: habits };
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));
        console.log('Data saved to data.json');
        
        res.json({ success: true, message: 'Data saved successfully' });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Initialize and start server
initializeDataFile();

app.listen(PORT, () => {
    console.log(`✅ HabitFlow Server running at http://localhost:${PORT}`);
    console.log(`📁 Data file: ${DATA_FILE}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
