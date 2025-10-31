let originalImageData = null;

// Handle image upload
document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            originalImageData = event.target.result;
            document.getElementById('originalImage').src = originalImageData;
            document.getElementById('uploadSection').style.display = 'none';
            document.getElementById('enhancementSection').style.display = 'block';
            
            // Reset enhanced image
            document.getElementById('enhancedImageContainer').innerHTML = 
                '<div class="placeholder">Select an enhancement option</div>';
        };
        reader.readAsDataURL(file);
    }
});

// Enhancement function
async function enhance(type) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';
    
    try {
        // Convert base64 to blob
        const base64Data = originalImageData.split(',')[1];
        const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(r => r.blob());
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', blob, 'image.jpg');
        
        // Define enhancement operations based on type
        let operations = {};
        
        switch(type) {
            case 'face':
                operations = {
                    restorations: {
                        upscale: "faces",
                        decompress: "auto",
                        polish: true
                    },
                    resizing: {
                        width: "200%",
                        height: "200%"
                    }
                };
                break;
            case 'photo':
                operations = {
                    restorations: {
                        upscale: "photo",
                        decompress: "auto",
                        polish: true
                    },
                    resizing: {
                        width: "200%",
                        height: "200%"
                    }
                };
                break;
            case 'smart':
                operations = {
                    restorations: {
                        upscale: "smart_enhance",
                        decompress: "auto"
                    },
                    resizing: {
                        width: "200%",
                        height: "200%"
                    }
                };
                break;
            case 'ultimate':
                operations = {
                    restorations: {
                        upscale: "smart_enhance",
                        decompress: "strong",
                        polish: true
                    },
                    resizing: {
                        width: "300%",
                        height: "300%"
                    }
                };
                break;
        }
        
        formData.append('operations', JSON.stringify(operations));
        
        // Call server endpoint
        const response = await fetch('/api/enhance', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Enhancement failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.data && result.data.output && result.data.output.tmp_url) {
            // Display enhanced image
            document.getElementById('enhancedImageContainer').innerHTML = 
                `<img src="${result.data.output.tmp_url}" alt="Enhanced" style="width: 100%; border-radius: 12px;">`;
        } else {
            throw new Error('Invalid response from API');
        }
        
    } catch (error) {
        console.error('Enhancement error:', error);
        alert('Enhancement failed: ' + error.message);
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

// Reset upload
function resetUpload() {
    document.getElementById('uploadSection').style.display = 'flex';
    document.getElementById('enhancementSection').style.display = 'none';
    document.getElementById('imageInput').value = '';
    originalImageData = null;
}                                                                                                                                                                                                                                                                                                                                                                                                                                                  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
