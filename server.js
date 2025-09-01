require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Basic security & parsing
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Redacted logging
app.use((req, res, next) => {
    const safeBody = { ...req.body };
    if (safeBody && safeBody.image) {
        safeBody.image = '[redacted]';
    }
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, safeBody && Object.keys(safeBody).length ? safeBody : '');
    next();
});

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || '';
if (!mongoUri) {
    console.warn('Warning: MONGODB_URI not set. Set it in .env to enable database.');
}

mongoose.set('strictQuery', true);
if (mongoUri) {
    mongoose
        .connect(mongoUri)
        .then(() => console.log('MongoDB connected'))
        .catch((err) => console.error('MongoDB connection error:', err.message));
}

// API Routes
const prescriptionsRouter = require('./src/routes/prescriptions');
const reportsRouter = require('./src/routes/reports');
const historyRouter = require('./src/routes/history');
const ttsRouter = require('./src/routes/tts');

app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/history', historyRouter);
app.use('/api/tts', ttsRouter);

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Serve React frontend
const frontendPath = path.join(__dirname, 'Frontend/MedLabScan/dist');
const indexPath = path.join(frontendPath, 'index.html');

// Check if React build exists
if (fs.existsSync(frontendPath)) {
    console.log('Serving React frontend from:', frontendPath);
    app.use(express.static(frontendPath));
    
    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
        res.sendFile(indexPath);
    });
} else {
    console.log('React build not found. Please run: npm run build');
    console.log('Or run in development mode: npm run dev');
    
    // Fallback message
    app.get('*', (req, res) => {
        res.send(`
            <html>
                <head><title>MedScanner</title></head>
                <body>
                    <h1>MedScanner Backend Running</h1>
                    <p>Frontend not built yet. Please run:</p>
                    <ul>
                        <li><code>npm run build</code> - Build and serve production</li>
                        <li><code>npm run dev</code> - Development mode with hot reload</li>
                    </ul>
                    <p>API endpoints available at <code>/api/*</code></p>
                </body>
            </html>
        `);
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
    console.log(`📱 Frontend will be available at http://localhost:${PORT}`);
    console.log(`🔌 API endpoints available at http://localhost:${PORT}/api/*`);
});



