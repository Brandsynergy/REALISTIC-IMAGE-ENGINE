import express from 'express';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

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
        
        // Parse operations from request
        const operations = JSON.parse(req.body.operations);
        
        console.log('Calling Claid API with operations:', JSON.stringify(operations, null, 2));
        
        // Step 1: Upload the image first
        const uploadForm = new FormData();
        uploadForm.append('file', req.file.buffer, {
            filename: 'image.jpg',
            contentType: req.file.mimetype
        });
        
        console.log('Uploading image to Claid...');
        
        const uploadResponse = await fetch('https://api.claid.ai/v1-beta1/image/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                ...uploadForm.getHeaders()
            },
            body: uploadForm
        });
        
        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Upload error:', errorText);
            return res.status(uploadResponse.status).json({ 
                error: 'Upload failed', 
                details: errorText 
            });
        }
        
        const uploadResult = await uploadResponse.json();
        console.log('Upload successful, temp URL:', uploadResult.data?.tmp_upload_url);
        
        // Step 2: Process the uploaded image
        const processBody = {
            input: uploadResult.data.tmp_upload_url,
            operations: operations
        };
        
        console.log('Processing image with body:', JSON.stringify(processBody, null, 2));
        
        const processResponse = await fetch('https://api.claid.ai/v1-beta1/image/edit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(processBody)
        });
        
        if (!processResponse.ok) {
            const errorText = await processResponse.text();
            console.error('Process error:', errorText);
            return res.status(processResponse.status).json({ 
                error: 'Enhancement failed', 
                details: errorText 
            });
        }
        
        const result = await processResponse.json();
        console.log('Enhancement successful!');
        
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
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
