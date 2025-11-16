// Application State
const appState = {
    gender: null,
    usualSize: null,
    footImage: null,
    footRatios: null,
    comfortMap: {
        toes: null,
        sides: null,
        midfoot: null,
        heel: null
    }
};

// Step Navigation
function showStep(stepId) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(stepId).classList.add('active');
}

// Step 1: Gender Selection
document.querySelectorAll('.gender-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        appState.gender = btn.dataset.gender;
        setTimeout(() => showStep('step-size'), 300);
    });
});

// Step 2: UK Size Input
document.getElementById('size-continue').addEventListener('click', () => {
    const size = parseFloat(document.getElementById('uk-size').value);
    if (size && size >= 3 && size <= 15) {
        appState.usualSize = size;
        showStep('step-photo');
    } else {
        alert('Please enter a valid UK size between 3 and 15');
    }
});

// Step 3: Photo Upload/Capture
const fileInput = document.getElementById('file-input');
const cameraBtn = document.getElementById('camera-btn');
const footImage = document.getElementById('foot-image');
const photoPreview = document.getElementById('photo-preview');
const photoUpload = document.getElementById('photo-upload');
const photoContinue = document.getElementById('photo-continue');
const retakePhoto = document.getElementById('retake-photo');

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImageFile(file);
    }
});

cameraBtn.addEventListener('click', () => {
    // On mobile, the file input with capture attribute will use camera
    // On desktop, it will open file picker
    fileInput.click();
});

// Improve mobile camera experience
if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
    // Modern browsers with camera API
    // The file input with capture="environment" should handle this automatically
}

retakePhoto.addEventListener('click', () => {
    photoPreview.style.display = 'none';
    photoUpload.style.display = 'flex';
    photoContinue.style.display = 'none';
    appState.footImage = null;
    fileInput.value = '';
});

photoContinue.addEventListener('click', () => {
    if (appState.footImage) {
        analyzeFootImage(appState.footImage);
        showStep('step-comfort');
    }
});

function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            footImage.src = e.target.result;
            appState.footImage = img;
            photoPreview.style.display = 'block';
            photoUpload.style.display = 'none';
            photoContinue.style.display = 'block';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Foot Image Analysis
function analyzeFootImage(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Extract foot measurements using relative geometry
    const measurements = extractFootMeasurements(canvas, ctx);
    
    // Calculate ratios
    appState.footRatios = {
        forefootWidthRatio: measurements.forefootWidth / measurements.footLength,
        toeTaperIndex: measurements.littleToeLength / measurements.bigToeLength,
        midfootWidthRatio: measurements.midfootWidth / measurements.forefootWidth,
        heelWidthRatio: measurements.heelWidth / measurements.forefootWidth
    };
}

function extractFootMeasurements(canvas, ctx) {
    // Extract foot measurements using image analysis
    // This uses relative geometry - no measurement card needed
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    
    // Convert to grayscale and find foot outline
    const grayscale = [];
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const gray = (r + g + b) / 3;
        grayscale.push(gray);
    }
    
    // Find foot boundaries using edge detection
    // Simple approach: find the main object (foot) by detecting significant color differences
    const threshold = 128; // Adjust based on image contrast
    
    // Find bounding box of foot (main object)
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let footPixels = 0;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const gray = grayscale[idx];
            
            // Simple threshold: assume foot is darker/lighter than background
            // In production, use more sophisticated segmentation
            const isFoot = gray < threshold || (gray > threshold && isNearFoot(x, y, grayscale, width, height, threshold));
            
            if (isFoot) {
                footPixels++;
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }
    
    // If we couldn't detect foot well, use image dimensions as fallback
    if (footPixels < width * height * 0.1) {
        minX = width * 0.1;
        maxX = width * 0.9;
        minY = height * 0.1;
        maxY = height * 0.9;
    }
    
    // Calculate foot dimensions (in pixels - relative measurements)
    const footLength = maxY - minY;
    const footWidth = maxX - minX;
    
    // Find width at different sections
    // Forefoot: top 30% of foot
    const forefootY = minY + (maxY - minY) * 0.3;
    const forefootWidth = getWidthAtY(forefootY, grayscale, width, height, minX, maxX, threshold);
    
    // Midfoot: middle 50% of foot
    const midfootY = minY + (maxY - minY) * 0.5;
    const midfootWidth = getWidthAtY(midfootY, grayscale, width, height, minX, maxX, threshold);
    
    // Heel: bottom 20% of foot
    const heelY = minY + (maxY - minY) * 0.8;
    const heelWidth = getWidthAtY(heelY, grayscale, width, height, minX, maxX, threshold);
    
    // Estimate toe lengths (simplified - would need more sophisticated detection)
    // Big toe: typically longest, at the front
    const bigToeLength = footLength * 0.22; // Relative to foot length
    // Little toe: shorter, estimate based on taper
    const taperEstimate = forefootWidth / footLength; // Higher = wider, less tapered
    const littleToeLength = bigToeLength * (0.5 + taperEstimate * 0.3); // Varies with taper
    
    return {
        footLength: footLength || height * 0.85,
        forefootWidth: forefootWidth || footWidth * 0.75,
        midfootWidth: midfootWidth || footWidth * 0.55,
        heelWidth: heelWidth || footWidth * 0.50,
        bigToeLength: bigToeLength || footLength * 0.22,
        littleToeLength: littleToeLength || footLength * 0.15
    };
}

function isNearFoot(x, y, grayscale, width, height, threshold) {
    // Check if pixel is near foot pixels (simple connectivity check)
    const radius = 5;
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const idx = ny * width + nx;
                if (grayscale[idx] < threshold) {
                    return true;
                }
            }
        }
    }
    return false;
}

function getWidthAtY(y, grayscale, width, height, minX, maxX, threshold) {
    // Find left and right edges of foot at given Y coordinate
    let leftEdge = minX;
    let rightEdge = maxX;
    
    // Find left edge
    for (let x = minX; x < maxX; x++) {
        const idx = Math.floor(y) * width + x;
        if (idx >= 0 && idx < grayscale.length && grayscale[idx] < threshold) {
            leftEdge = x;
            break;
        }
    }
    
    // Find right edge
    for (let x = maxX; x > minX; x--) {
        const idx = Math.floor(y) * width + x;
        if (idx >= 0 && idx < grayscale.length && grayscale[idx] < threshold) {
            rightEdge = x;
            break;
        }
    }
    
    return rightEdge - leftEdge || (maxX - minX) * 0.6;
}

// Step 4: Comfort Map
const zones = ['toes', 'sides', 'midfoot', 'heel'];
let currentZone = null;
const zoneControls = document.getElementById('zone-controls');
const zoneName = document.getElementById('zone-name');
const comfortOptions = document.querySelectorAll('.comfort-options')[0];
const heelOptions = document.getElementById('heel-options');
const zoneDone = document.getElementById('zone-done');
const comfortSummary = document.getElementById('comfort-summary');
const comfortContinue = document.getElementById('comfort-continue');

zones.forEach(zoneId => {
    const zone = document.getElementById(`zone-${zoneId}`);
    zone.addEventListener('click', () => {
        currentZone = zoneId;
        document.querySelectorAll('.zone').forEach(z => z.classList.remove('selected'));
        zone.classList.add('selected');
        
        zoneControls.style.display = 'block';
        zoneName.textContent = zoneId;
        
        if (zoneId === 'heel') {
            comfortOptions.style.display = 'none';
            heelOptions.style.display = 'flex';
        } else {
            comfortOptions.style.display = 'flex';
            heelOptions.style.display = 'none';
        }
        
        // Reset button states
        document.querySelectorAll('.comfort-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
    });
});

document.querySelectorAll('.comfort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.comfort-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    });
});

zoneDone.addEventListener('click', () => {
    const selectedBtn = document.querySelector('.comfort-btn.selected');
    if (selectedBtn && currentZone) {
        appState.comfortMap[currentZone] = selectedBtn.dataset.value;
        updateComfortSummary();
        zoneControls.style.display = 'none';
        document.querySelectorAll('.zone').forEach(z => z.classList.remove('selected'));
        currentZone = null;
        
        // Check if all zones are filled
        const allFilled = zones.every(zone => appState.comfortMap[zone] !== null);
        if (allFilled) {
            comfortContinue.style.display = 'block';
        }
    }
});

function updateComfortSummary() {
    const summaryHTML = zones.map(zone => {
        const value = appState.comfortMap[zone];
        if (value) {
            return `
                <div class="comfort-summary-item">
                    <span class="zone-label">${zone}</span>
                    <span class="zone-value">${value}</span>
                </div>
            `;
        }
        return '';
    }).join('');
    
    comfortSummary.innerHTML = summaryHTML || '<p style="color: #999; text-align: center;">Tap zones above to add your feedback</p>';
}

comfortContinue.addEventListener('click', () => {
    const recommendation = calculateRecommendation();
    displayResults(recommendation);
    showStep('step-results');
});

// Size Recommendation Logic
function calculateRecommendation() {
    const { usualSize, footRatios, comfortMap } = appState;
    let recommendedSize = usualSize;
    let recommendedWidth = 'Normal';
    const explanations = [];
    
    // Analyze foot shape
    const isWideForefoot = footRatios.forefootWidthRatio > 0.38;
    const isTapered = footRatios.toeTaperIndex < 0.65;
    const isSquare = footRatios.toeTaperIndex > 0.75;
    const isNarrowHeel = footRatios.heelWidthRatio < 0.70;
    
    // Width recommendation based on forefoot ratio and side tightness
    if (isWideForefoot) {
        recommendedWidth = 'Wide';
        explanations.push('Your forefoot looks naturally broad, so we recommend the Wide fit.');
    }
    
    if (comfortMap.sides === 'tight') {
        if (recommendedWidth === 'Normal') {
            recommendedWidth = 'Wide';
            explanations.push('You mentioned side tightness, so we recommend the Wide fit.');
        }
    }
    
    // Size adjustments based on toe tightness and foot shape
    if (comfortMap.toes === 'tight') {
        if (isTapered) {
            // Tapered foot with toe tightness = length problem
            recommendedSize = Math.min(recommendedSize + 0.5, 15);
            explanations.push('You mentioned toe tightness; we added half a size for extra room.');
        } else if (isSquare || isWideForefoot) {
            // Square/wide foot with toe tightness = try wide first, then size up
            if (recommendedWidth === 'Normal') {
                recommendedWidth = 'Wide';
                explanations.push('Your toe tightness suggests you need more width.');
            } else {
                recommendedSize = Math.min(recommendedSize + 0.5, 15);
                explanations.push('Even with Wide fit, we added half a size for your toe comfort.');
            }
        }
    }
    
    // Heel slippage logic
    if (comfortMap.heel === 'slips') {
        if (isNarrowHeel) {
            explanations.push('Your heel shape is slightly narrow, so consider heel-lock lacing for best grip.');
        } else if (comfortMap.toes === 'loose' || comfortMap.sides === 'loose') {
            recommendedSize = Math.max(recommendedSize - 0.5, 3);
            explanations.push('Heel slippage combined with loose fit elsewhere suggests going down half a size.');
        }
    }
    
    // Midfoot tightness (typically doesn't change size, but we note it)
    if (comfortMap.midfoot === 'tight') {
        explanations.push('For midfoot tightness, consider lacing techniques or flexible materials.');
    }
    
    // Ensure size adjustment never exceeds ±0.5 from usual (unless explicitly needed)
    const sizeDiff = Math.abs(recommendedSize - usualSize);
    if (sizeDiff > 0.5) {
        // Cap at ±0.5 unless there are strong indicators
        const strongIndicators = (comfortMap.toes === 'tight' && isTapered) || 
                                 (comfortMap.heel === 'slips' && (comfortMap.toes === 'loose' || comfortMap.sides === 'loose'));
        if (!strongIndicators) {
            if (recommendedSize > usualSize) {
                recommendedSize = usualSize + 0.5;
            } else {
                recommendedSize = usualSize - 0.5;
            }
        }
    }
    
    // Round to nearest 0.5
    recommendedSize = Math.round(recommendedSize * 2) / 2;
    
    // Ensure size is within bounds
    recommendedSize = Math.max(3, Math.min(15, recommendedSize));
    
    return {
        size: recommendedSize,
        width: recommendedWidth,
        explanation: explanations.length > 0 ? explanations.join(' ') : 'Based on your foot shape and feedback, we recommend this size and width.'
    };
}

// Step 5: Results
function displayResults(recommendation) {
    document.getElementById('result-size').textContent = recommendation.size;
    document.getElementById('result-width').textContent = recommendation.width;
    document.getElementById('result-explanation').textContent = recommendation.explanation;
}

document.getElementById('start-over').addEventListener('click', () => {
    // Reset state
    appState.gender = null;
    appState.usualSize = null;
    appState.footImage = null;
    appState.footRatios = null;
    appState.comfortMap = {
        toes: null,
        sides: null,
        midfoot: null,
        heel: null
    };
    
    // Reset UI
    document.getElementById('uk-size').value = '';
    fileInput.value = '';
    photoPreview.style.display = 'none';
    photoUpload.style.display = 'flex';
    photoContinue.style.display = 'none';
    zoneControls.style.display = 'none';
    comfortSummary.innerHTML = '';
    comfortContinue.style.display = 'none';
    document.querySelectorAll('.zone').forEach(z => z.classList.remove('selected'));
    document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('selected'));
    
    showStep('step-gender');
});

