import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files
app.use(express.static(__dirname));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', apiKey: process.env.REPLICATE_API_KEY ? 'loaded' : 'missing' });
});

// Get API key endpoint
app.get('/api/key', (req, res) => {
    const apiKey = process.env.REPLICATE_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }
    res.json({ key: apiKey });
});

// Proxy endpoint for Replicate API
app.post('/api/replicate', async (req, res) => {
    const apiKey = process.env.REPLICATE_API_KEY;
    
    if (!apiKey) {
        console.error('❌ API Key not found in environment variables');
        return res.status(500).json({ error: 'API key not configured on server' });
    }

    const { url, method, body } = req.body;

    try {
        const fetch = (await import('node-fetch')).default;
        
        console.log(`📡 Making ${method} request to: ${url}`);
        
        const options = {
            method: method || 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'REALISTIC-IMAGE-ENGINE/1.0'
            }
        };

        if (body && method === 'POST') {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        console.log(`✅ Response status: ${response.status}`);

        if (!response.ok) {
            console.error('❌ Replicate API Error:', data);
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('❌ Server Error:', error.message);
        res.status(500).json({ 
            error: 'Server error', 
            message: error.message,
            details: error.toString()
        });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 REALISTIC IMAGE ENGINE running on port ${PORT}`);
    const apiKey = process.env.REPLICATE_API_KEY;
    if (apiKey) {
        console.log(`✅ API Key: Loaded (${apiKey.substring(0, 8)}...)`);
    } else {
        console.log(`❌ API Key: NOT FOUND - Please add REPLICATE_API_KEY to environment variables`);
    }
});                                                                                                                                                                                                                                                                                                                                                                                                                                 
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
