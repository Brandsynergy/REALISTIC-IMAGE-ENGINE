// ============================================
// REALISTIC IMAGE ENGINE - SECURE VERSION
// API Key loaded from server environment
// ============================================

// 🔑 CONFIGURATION
let CONFIG = {
    REPLICATE_API_KEY: '',
    
    MODELS: {
        skin: 'tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3',
        upscale: 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
        enhance: 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
        face: 'tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3',
        denoise: 'sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56',
        combo: 'sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56'
    }
};

// ============================================
// GLOBAL STATE
// ============================================
let uploadedImage = null;
let enhancedImageUrl = null;
let apiKeyLoaded = false;

// ============================================
// DOM ELEMENTS
// ============================================
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
// LOAD API KEY FROM SERVER
// ============================================
async function loadAPIKey() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        CONFIG.REPLICATE_API_KEY = data.apiKey;
        apiKeyLoaded = true;
        console.log('%c🔑 API Key loaded securely from environment!', 'color: #4ade80; font-size: 14px; font-weight: bold;');
    } catch (error) {
        console.error('Failed to load API key:', error);
        apiKeyLoaded = false;
    }
}

// Load API key when page loads
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
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
        showError('Image size must be less than 10MB. Please choose a smaller image.');
        return;
    }

    // Validate file type
    if (!file.type.match('image.*')) {
        showError('Please upload a valid image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImage = e.target.result;
        originalImage.src = uploadedImage;
        
        // Show preview and options with smooth transition
        uploadSection.style.display = 'none';
        previewSection.style.display = 'block';
        enhancementOptions.style.display = 'block';
        
        hideError();
        
        // Smooth scroll to options
        setTimeout(() => {
            enhancementOptions.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    };
    reader.readAsDataURL(file);
}

async function enhanceImage(type) {
    // Check if API key is loaded
    if (!apiKeyLoaded || !CONFIG.REPLICATE_API_KEY) {
        showError('⚠️ API Key not loaded. Please refresh the page or check your Render Environment Variables.');
        return;
    }

    // Show loading state
    loading.style.display = 'block';
    enhancementOptions.style.display = 'none';
    downloadSection.style.display = 'none';
    hideError();

    // Scroll to loading
    setTimeout(() => {
        loading.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    try {
        // Convert image to blob
        const blob = await fetch(uploadedImage).then(r => r.blob());
        const imageUrl = await uploadImageToReplicate(blob);
        
        // Get model and create prediction
        const modelVersion = CONFIG.MODELS[type];
        const prediction = await createPrediction(modelVersion, imageUrl, type);
        
        // Wait for result
        const result = await waitForPrediction(prediction.id);
        
        // Display enhanced image
        displayEnhancedImage(result.output);
        
    } catch (error) {
        console.error('Enhancement error:', error);
        
        // More detailed error message
        let errorMsg = 'Enhancement failed. ';
        if (error.message.includes('Failed to fetch')) {
            errorMsg += 'Network error - please check your internet connection and API key.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
            errorMsg += 'Invalid API key. Please check your Replicate API key in Render Environment Variables.';
        } else if (error.message.includes('429')) {
            errorMsg += 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('402')) {
            errorMsg += 'Insufficient credits. Please add credits to your Replicate account.';
        } else {
            errorMsg += error.message;
        }
        
        showError(errorMsg);
        enhancementOptions.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

async function uploadImageToReplicate(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function createPrediction(modelVersion, imageUrl, type) {
    let inputParams = { image: imageUrl };

    // Configure parameters based on enhancement type
    switch(type) {
        case 'upscale':
            inputParams.scale = 4;
            inputParams.face_enhance = true;
            break;
        case 'skin':
        case 'face':
            inputParams.version = '1.4';
            inputParams.scale = 2;
            break;
        case 'denoise':
            inputParams.codeformer_fidelity = 0.7;
            inputParams.background_enhance = true;
            inputParams.face_upsample = true;
            inputParams.upscale = 2;
            break;
        case 'combo':
            inputParams.codeformer_fidelity = 0.8;
            inputParams.background_enhance = true;
            inputParams.face_upsample = true;
            inputParams.upscale = 4;
            break;
        default:
            inputParams.scale = 2;
            inputParams.face_enhance = true;
    }

    try {
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${CONFIG.REPLICATE_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                version: modelVersion,
                input: inputParams
            }),
            mode: 'cors'
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function waitForPrediction(predictionId) {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
                headers: {
                    'Authorization': `Token ${CONFIG.REPLICATE_API_KEY}`,
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to check prediction status`);
            }

            const prediction = await response.json();

            if (prediction.status === 'succeeded') {
                return prediction;
            }

            if (prediction.status === 'failed') {
                throw new Error(prediction.error || 'Enhancement failed on server. Please try again.');
            }

            if (prediction.status === 'canceled') {
                throw new Error('Enhancement was canceled. Please try again.');
            }

            // Wait 1 second before checking again
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        } catch (error) {
            console.error('Polling error:', error);
            throw error;
        }
    }

    throw new Error('Enhancement timed out. Please try again with a smaller image.');
}

function displayEnhancedImage(outputUrl) {
    let imageUrl = Array.isArray(outputUrl) ? outputUrl[0] : outputUrl;
    
    enhancedImageUrl = imageUrl;
    enhancedContainer.innerHTML = `<img src="${imageUrl}" alt="Enhanced" style="width: 100%; border-radius: 16px;">`;
    
    downloadSection.style.display = 'block';
    enhancementOptions.style.display = 'block';
    
    // Scroll to result
    setTimeout(() => {
        downloadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
}

function downloadImage() {
    if (!enhancedImageUrl) return;
    
    const link = document.createElement('a');
    link.href = enhancedImageUrl;
    link.download = `realistic-enhanced-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showError(message) {
    const errorCard = errorMessage.querySelector('.error-card');
    const errorText = errorCard ? errorCard.querySelector('.error-text') : null;
    
    if (errorText) {
        errorText.textContent = message;
    } else {
        errorMessage.innerHTML = `
            <div class="glass-card error-card">
                <div class="error-icon">⚠️</div>
                <p class="error-text">${message}</p>
            </div>
        `;
    }
    
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
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// INITIALIZATION
// ============================================
console.log('%c⚡ REALISTIC IMAGE ENGINE', 'color: #667eea; font-size: 20px; font-weight: bold;');
console.log('%c✅ Professional AI Models Loaded', 'color: #4ade80; font-size: 14px;');
console.log('%c🔄 Loading API key from secure environment...', 'color: #f093fb; font-size: 14px;');
