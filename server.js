const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(__dirname));

// API endpoint to get the API key securely
app.get('/api/config', (req, res) => {
    res.json({
        apiKey: process.env.REPLICATE_API_KEY || ''
    });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 REALISTIC IMAGE ENGINE running on port ${PORT}`);
    console.log(`✅ API Key: ${process.env.REPLICATE_API_KEY ? 'Loaded' : 'NOT FOUND'}`);
});
