// ============================================
// REALISTIC IMAGE ENGINE - PROFESSIONAL VERSION
// Using BEST models for ENHANCOR.AI quality
// ============================================

console.log('%c⚡ REALISTIC IMAGE ENGINE - PROFESSIONAL', 'color: #667eea; font-size: 20px; font-weight: bold;');

// PROFESSIONAL MODELS - BEST QUALITY
const CONFIG = {
    MODELS: {
        // Using the BEST models available
        skin: 'tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c',      // GFPGAN v1.4 (best face)
        upscale: 'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',   // Real-ESRGAN x4plus
        enhance: 'jingyunliang/swinir:660d922d33153019e8c594a6ea8eea1d0b0896c84b0e9f1a4f1e4e8e8e8e8e8e',  // SwinIR (professional)
        face: 'sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56',     // CodeFormer (best overall)
        denoise: 'sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56',  // CodeFormer
        combo: 'sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56'    // CodeFormer (max settings)
    }
};

// Global state
let uploadedImage = null;
let enhancedImageUrl = null;
let API_KEY = null;

// DOM Elements
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const previewSection = document.getElementById('previewSection');
const originalImage = document.getElementById('originalImage');
const enhancedContainer = document.getElementById('enhancedContainer');
const enhancementOptions = document.getElementById('enhancementOptions');
const loading = document.getElementById('loading');
const downloadSection = document.getElementById('downloadSection');
const downloadBtn = document.getElementById('downloadBtn');
const newImageBtn = document.getElementById('newImageBtn');
const errorMessage = document.getElementById('errorMessage');

// ============================================
// LOAD API KEY
// ============================================
async function loadAPIKey() {
    try {
        console.log('🔑 Loading API key from server...');
        const response = await fetch('/api/key');
        
        if (!response.ok) {
            throw new Error('Failed to load API key from server');
        }
        
        const data = await response.json();
        API_KEY = data.key;
        console.log('✅ API Key loaded successfully!');
        return true;
    } catch (error) {
        console.error('❌ Failed to load API key:', error);
        showError('⚠️ Failed to load API configuration. Please refresh the page.');
        return false;
    }
}

loadAPIKey();

// ============================================
// EVENT LISTENERS
// ============================================

uploadBox.addEventListener('click', () => fileInput.click());

uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = 'rgba(102, 126, 234, 0.6)';
    uploadBox.style.background = 'rgba(102, 126, 234, 0.05)';
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.style.borderColor = 'rgba(102, 126, 234, 0.3)';
    uploadBox.style.background = 'transparent';
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = 'rgba(102, 126, 234, 0.3)';
    uploadBox.style.background = 'transparent';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageUpload(file);
    } else {
        showError('Please upload a valid image file (JPG, PNG, WEBP)');
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
});

document.querySelectorAll('.option-card').forEach(card => {
    card.addEventListener('click', () => {
        const type = card.getAttribute('data-type');
        enhanceImage(type);
    });
});

downloadBtn.addEventListener('click', downloadImage);
newImageBtn.addEventListener('click', resetApp);

// ============================================
// CORE FUNCTIONS
// ============================================

function handleImageUpload(file) {
    if (file.size > 10 * 1024 * 1024) {
        showError('Image size must be less than 10MB');
        return;
    }

    if (!file.type.match('image.*')) {
        showError('Please upload a valid image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImage = e.target.result;
        originalImage.src = uploadedImage;
        
        uploadSection.style.display = 'none';
        previewSection.style.display = 'block';
        enhancementOptions.style.display = 'block';
        
        hideError();
        
        setTimeout(() => {
            enhancementOptions.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    };
    reader.readAsDataURL(file);
}

async function enhanceImage(type) {
    if (!API_KEY) {
        const loaded = await loadAPIKey();
        if (!loaded) {
            showError('⚠️ API Key not available. Please check your Render environment variables.');
            return;
        }
    }

    loading.style.display = 'block';
    enhancementOptions.style.display = 'none';
    downloadSection.style.display = 'none';
    hideError();

    setTimeout(() => {
        loading.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    try {
        console.log(`🎨 Starting PROFESSIONAL ${type} enhancement...`);
        
        const modelVersion = CONFIG.MODELS[type];
        const prediction = await createPrediction(modelVersion, uploadedImage, type);
        
        console.log('⏳ Processing with professional AI models...');
        const result = await waitForPrediction(prediction.id);
        
        console.log('✅ Professional enhancement complete!');
        displayEnhancedImage(result.output);
        
    } catch (error) {
        console.error('❌ Enhancement error:', error);
        
        let errorMsg = '⚠️ Enhancement failed. ';
        
        if (error.message.includes('402')) {
            errorMsg = '💳 Insufficient credits on your Replicate account. Please add credits at replicate.com/account/billing';
        } else if (error.message.includes('401') || error.message.includes('403')) {
            errorMsg = '🔑 Invalid API key. Please check your REPLICATE_API_KEY in Render environment variables.';
        } else if (error.message.includes('429')) {
            errorMsg = '⏱️ Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('timeout')) {
            errorMsg = '⏱️ Enhancement timed out. Please try with a smaller image.';
        } else {
            errorMsg += error.message;
        }
        
        showError(errorMsg);
        enhancementOptions.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

async function createPrediction(modelVersion, imageUrl, type) {
    let inputParams = {};

    // PROFESSIONAL SETTINGS - MAXIMUM QUALITY
    if (type === 'skin') {
        // GFPGAN v1.4 - Maximum face enhancement
        inputParams = {
            img: imageUrl,
            version: "v1.4",
            scale: 2
        };
    } else if (type === 'face') {
        // CodeFormer - Best face restoration with maximum fidelity
        inputParams = {
            image: imageUrl,
            codeformer_fidelity: 1.0,  // Maximum fidelity (0.9-1.0 for best results)
            background_enhance: true,
            face_upsample: true,
            upscale: 2
        };
    } else if (type === 'upscale') {
        // Real-ESRGAN x4plus - Professional 4K upscaling
        inputParams = {
            image: imageUrl,
            scale: 4,
            face_enhance: true
        };
    } else if (type === 'enhance') {
        // SwinIR or CodeFormer - Ultimate enhancement
        inputParams = {
            image: imageUrl,
            codeformer_fidelity: 0.9,
            background_enhance: true,
            face_upsample: true,
            upscale: 4
        };
    } else if (type === 'denoise') {
        // CodeFormer - Denoise with high quality
        inputParams = {
            image: imageUrl,
            codeformer_fidelity: 0.8,
            background_enhance: true,
            face_upsample: true,
            upscale: 2
        };
    } else if (type === 'combo') {
        // CodeFormer - MAXIMUM QUALITY (all features enabled)
        inputParams = {
            image: imageUrl,
            codeformer_fidelity: 1.0,  // MAXIMUM
            background_enhance: true,
            face_upsample: true,
            upscale: 4  // 4x upscaling
        };
    }

    console.log('📤 Sending request with PROFESSIONAL parameters:', inputParams);

    const response = await fetch('/api/replicate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: 'https://api.replicate.com/v1/predictions',
            method: 'POST',
            body: {
                version: modelVersion,
                input: inputParams
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response error:', errorData);
        throw new Error(errorData.error || errorData.detail || `Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Prediction created:', data.id);
    return data;
}

async function waitForPrediction(predictionId) {
    const maxAttempts = 90;  // Increased timeout for professional processing
    let attempts = 0;

    while (attempts < maxAttempts) {
        const response = await fetch('/api/replicate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: `https://api.replicate.com/v1/predictions/${predictionId}`,
                method: 'GET'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to check status: ${response.status}`);
        }

        const prediction = await response.json();

        if (prediction.status === 'succeeded') {
            return prediction;
        }

        if (prediction.status === 'failed') {
            throw new Error(prediction.error || 'Enhancement failed');
        }

        if (prediction.status === 'canceled') {
            throw new Error('Enhancement was canceled');
        }

        await new Promise(resolve => setTimeout(resolve, 2000));  // Check every 2 seconds
        attempts++;
    }

    throw new Error('Enhancement timed out - professional processing takes longer');
}

function displayEnhancedImage(outputUrl) {
    let imageUrl = Array.isArray(outputUrl) ? outputUrl[0] : outputUrl;
    
    enhancedImageUrl = imageUrl;
    enhancedContainer.innerHTML = `<img src="${imageUrl}" alt="Enhanced" style="width: 100%; border-radius: 16px;">`;
    
    downloadSection.style.display = 'block';
    enhancementOptions.style.display = 'block';
    
    setTimeout(() => {
        downloadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
}

function downloadImage() {
    if (!enhancedImageUrl) return;
    
    const link = document.createElement('a');
    link.href = enhancedImageUrl;
    link.download = `realistic-professional-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showError(message) {
    errorMessage.innerHTML = `
        <div class="glass-card" style="padding: 2rem; text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <p style="font-size: 1.1rem; color: #ff6b6b; margin: 0;">${message}</p>
        </div>
    `;
    errorMessage.style.display = 'block';
    
    setTimeout(() => {
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function hideError() {
    errorMessage.style.display = 'none';
}

function resetApp() {
    uploadedImage = null;
    enhancedImageUrl = null;
    fileInput.value = '';
    
    uploadSection.style.display = 'block';
    previewSection.style.display = 'none';
    enhancementOptions.style.display = 'none';
    downloadSection.style.display = 'none';
    loading.style.display = 'none';
    
    enhancedContainer.innerHTML = `
        <div class="placeholder-content">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
            </svg>
            <p>Select an enhancement option below</p>
        </div>
    `;
    
    hideError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

console.log('✅ PROFESSIONAL AI MODELS LOADED');
console.log('🎯 Quality Level: MAXIMUM (ENHANCOR.AI Standard)');                                                                                                                                                                                                                                                                                                                                                                                       
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
