import express from 'express';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Serve static files
app.use(express.static(__dirname));

// API endpoint for enhancement
app.post('/api/enhance', upload.single('file'), async (req, res) => {
    try {
        const apiKey = process.env.CLAID_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }
        
        console.log('Received enhancement request');
        
        // Create form data for Claid API
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: 'image.jpg',
            contentType: req.file.mimetype
        });
        
        // Parse operations from request
        const operations = JSON.parse(req.body.operations);
        formData.append('data', JSON.stringify({ operations }));
        
        console.log('Calling Claid API with operations:', operations);
        
        // Call Claid API
        const response = await fetch('https://api.claid.ai/v1-beta1/image/edit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                ...formData.getHeaders()
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Claid API error:', errorText);
            return res.status(response.status).json({ 
                error: 'Enhancement failed', 
                details: errorText 
            });
        }
        
        const result = await response.json();
        console.log('Enhancement successful');
        
        res.json(result);
        
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Server error', 
            message: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('API Key loaded:', process.env.CLAID_API_KEY ? 'Yes' : 'No');
});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
