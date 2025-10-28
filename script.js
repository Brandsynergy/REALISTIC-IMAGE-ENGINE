// ============================================
// CONFIGURATION - PUT YOUR API KEY HERE
// ============================================
const CONFIG = {
    // 🔑 PASTE YOUR REPLICATE API KEY BELOW (between the quotes)
    REPLICATE_API_KEY: 'r8_5C6elh8k2MVRHayUa421olsnwB733aB2jk7ld'                    
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
  ,

    // ⭐ PROFESSIONAL AI MODELS - ENHANCOR Quality ⭐
    MODELS: {
        // GFPGAN - Professional face restoration (~$0.01/image)
        skin: 'tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3',
        
        // Real-ESRGAN - Industry standard 4K upscaling (~$0.006/image)
        upscale: 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
        
        // Real-ESRGAN with face enhancement
        enhance: 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
        
        // GFPGAN - Face restoration
        face: 'tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3',
        
        // CodeFormer - Robust face restoration (~$0.01/image)
        denoise: 'sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56',
        
        // Ultimate combo
        combo: 'sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56'
    }
};

// ============================================
// GLOBAL VARIABLES
// ============================================
let uploadedImage = null;
let enhancedImageUrl = null;

// ============================================
// DOM ELEMENTS
// ============================================
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
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
// EVENT LISTENERS
// ============================================

uploadBox.addEventListener('click', () => {
    fileInput.click();
});

uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#7e22ce';
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.style.borderColor = '#2a5298';
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#2a5298';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageUpload(file);
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImageUpload(file);
    }
});

document.querySelectorAll('.option-card').forEach(button => {
    button.addEventListener('click', () => {
        const enhancementType = button.getAttribute('data-type');
        enhanceImage(enhancementType);
    });
});

downloadBtn.addEventListener('click', () => {
    if (enhancedImageUrl) {
        const link = document.createElement('a');
        link.href = enhancedImageUrl;
        link.download = 'realistic-enhanced-image.png';
        link.click();
    }
});

newImageBtn.addEventListener('click', () => {
    resetApp();
});

// ============================================
// FUNCTIONS
// ============================================

function handleImageUpload(file) {
    if (file.size > 10 * 1024 * 1024) {
        showError('Image is too large. Please upload an image smaller than 10MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImage = e.target.result;
        originalImage.src = uploadedImage;
        previewSection.style.display = 'grid';
        enhancementOptions.style.display = 'block';
        hideError();
    };
    reader.readAsDataURL(file);
}

async function enhanceImage(type) {
    if (CONFIG.REPLICATE_API_KEY === 'YOUR_REPLICATE_API_KEY_HERE') {
        showError('⚠️ Please add your Replicate API key in the script.js file first!');
        return;
    }

    loading.style.display = 'block';
    enhancementOptions.style.display = 'none';
    downloadSection.style.display = 'none';
    hideError();

    try {
        const blob = await fetch(uploadedImage).then(r => r.blob());
        const imageUrl = await uploadImageToReplicate(blob);
        const modelVersion = CONFIG.MODELS[type];
        const prediction = await createPrediction(modelVersion, imageUrl, type);
        const result = await waitForPrediction(prediction.id);
        displayEnhancedImage(result.output);
    } catch (error) {
        console.error('Enhancement error:', error);
        showError('Enhancement failed: ' + error.message + '. Please check your API key and try again.');
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

    if (type === 'upscale') {
        inputParams.scale = 4;
        inputParams.face_enhance = true;
    } else if (type === 'skin' || type === 'face') {
        inputParams.version = '1.4';
        inputParams.scale = 2;
    } else if (type === 'denoise') {
        inputParams.codeformer_fidelity = 0.7;
        inputParams.background_enhance = true;
        inputParams.face_upsample = true;
        inputParams.upscale = 2;
    } else if (type === 'combo') {
        inputParams.codeformer_fidelity = 0.8;
        inputParams.background_enhance = true;
        inputParams.face_upsample = true;
        inputParams.upscale = 4;
    } else {
        inputParams.scale = 2;
        inputParams.face_enhance = true;
    }

    const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${CONFIG.REPLICATE_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            version: modelVersion,
            input: inputParams
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create prediction');
    }

    return await response.json();
}

async function waitForPrediction(predictionId) {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
        const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: {
                'Authorization': `Token ${CONFIG.REPLICATE_API_KEY}`,
            }
        });

        const prediction = await response.json();

        if (prediction.status === 'succeeded') {
            return prediction;
        }

        if (prediction.status === 'failed') {
            throw new Error('Enhancement failed on server');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
    }

    throw new Error('Enhancement timed out');
}

function displayEnhancedImage(outputUrl) {
    let imageUrl = outputUrl;
    if (Array.isArray(outputUrl)) {
        imageUrl = outputUrl[0];
    }

    enhancedImageUrl = imageUrl;
    enhancedContainer.innerHTML = `<img src="${imageUrl}" alt="Enhanced" style="width: 100%; border-radius: 10px;">`;
    downloadSection.style.display = 'block';
    enhancementOptions.style.display = 'block';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function resetApp() {
    uploadedImage = null;
    enhancedImageUrl = null;
    fileInput.value = '';
    previewSection.style.display = 'none';
    enhancementOptions.style.display = 'none';
    downloadSection.style.display = 'none';
    loading.style.display = 'none';
    enhancedContainer.innerHTML = '<p class="placeholder-text">Select an enhancement option below</p>';
    hideError();
}

// ============================================
// INITIALIZATION
// ============================================
console.log('⚡ REALISTIC IMAGE ENGINE - Ready!');
console.log('✅ Professional AI Models Loaded');
