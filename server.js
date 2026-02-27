require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── ENV VARS ──────────────────────────────────────────────────────────────────
// Required: set these in your environment or a .env file
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/habitflow?retryWrites=true&w=majority';
const JWT_SECRET = process.env.JWT_SECRET || 'habitflow_jwt_secret_change_me_in_production';

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ─── MONGOOSE MODELS ───────────────────────────────────────────────────────────

// User Model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);

// Habit Model
const habitSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'Other' },
    color: { type: String, default: '#4ade80' },
    target: { type: Number, default: 7 }, // days per week
    completed: { type: Map, of: Boolean, default: {} }, // { "2025-02-26": true }
    streak: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const Habit = mongoose.model('Habit', habitSchema);

// ─── AUTH MIDDLEWARE ───────────────────────────────────────────────────────────
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

// ─── AUTH ROUTES ───────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        const user = new User({ name, email, password });
        await user.save();

        const token = generateToken(user._id);
        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });

        console.log(`✅ New user registered: ${email}`);
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const valid = await user.comparePassword(password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user._id);
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });

        console.log(`✅ User logged in: ${email}`);
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// ─── HABIT ROUTES ──────────────────────────────────────────────────────────────

// GET /api/habits — fetch user's habits
app.get('/api/habits', authenticate, async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.userId }).sort({ createdAt: -1 });

        // Convert Mongoose Map to plain object for each habit
        const result = habits.map(h => ({
            _id: h._id,
            name: h.name,
            category: h.category,
            color: h.color,
            target: h.target,
            streak: h.streak,
            completed: Object.fromEntries(h.completed || new Map()),
            createdAt: h.createdAt
        }));

        res.json(result);
    } catch (err) {
        console.error('Get habits error:', err);
        res.status(500).json({ error: 'Failed to fetch habits' });
    }
});

// POST /api/habits — create a new habit
app.post('/api/habits', authenticate, async (req, res) => {
    try {
        const { name, category, color, target, completed, streak } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Habit name is required' });
        }

        const habit = new Habit({
            userId: req.userId,
            name,
            category: category || 'Other',
            color: color || '#4ade80',
            target: target || 7,
            completed: completed || {},
            streak: streak || 0
        });

        await habit.save();

        res.status(201).json({
            _id: habit._id,
            name: habit.name,
            category: habit.category,
            color: habit.color,
            target: habit.target,
            streak: habit.streak,
            completed: Object.fromEntries(habit.completed || new Map()),
            createdAt: habit.createdAt
        });

        console.log(`✅ Habit created: "${name}" for user ${req.userId}`);
    } catch (err) {
        console.error('Create habit error:', err);
        res.status(500).json({ error: 'Failed to create habit' });
    }
});

// PUT /api/habits/:id — update a habit (toggle completion, streak update, etc.)
app.put('/api/habits/:id', authenticate, async (req, res) => {
    try {
        const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });

        if (!habit) {
            return res.status(404).json({ error: 'Habit not found' });
        }

        const { name, category, color, target, completed, streak } = req.body;

        if (name !== undefined) habit.name = name;
        if (category !== undefined) habit.category = category;
        if (color !== undefined) habit.color = color;
        if (target !== undefined) habit.target = target;
        if (streak !== undefined) habit.streak = streak;

        // Update completed map
        if (completed && typeof completed === 'object') {
            habit.completed = new Map(Object.entries(completed));
        }

        await habit.save();

        res.json({
            _id: habit._id,
            name: habit.name,
            category: habit.category,
            color: habit.color,
            target: habit.target,
            streak: habit.streak,
            completed: Object.fromEntries(habit.completed || new Map()),
            createdAt: habit.createdAt
        });
    } catch (err) {
        console.error('Update habit error:', err);
        res.status(500).json({ error: 'Failed to update habit' });
    }
});

// DELETE /api/habits/:id
app.delete('/api/habits/:id', authenticate, async (req, res) => {
    try {
        const result = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.userId });

        if (!result) {
            return res.status(404).json({ error: 'Habit not found' });
        }

        res.json({ success: true, message: 'Habit deleted' });
        console.log(`🗑 Habit deleted: ${req.params.id}`);
    } catch (err) {
        console.error('Delete habit error:', err);
        res.status(500).json({ error: 'Failed to delete habit' });
    }
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ─── CONNECT & START ──────────────────────────────────────────────────────────
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => {
        console.log(`🚀 HabitFlow running at http://localhost:${PORT}`);
        console.log(`📊 API available at http://localhost:${PORT}/api`);
    });
}).catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Make sure MONGO_URI environment variable is set correctly');
    process.exit(1);
});

mongoose.connection.on('error', err => {
    console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
});
