async function postForm(url, formData) {
    const res = await fetch(url, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
}

function renderCard(container, title, obj) {
    const box = document.createElement('div');
    box.className = 'card-box';
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(obj, null, 2);
    const h = document.createElement('h3');
    h.textContent = title;
    box.appendChild(h);
    box.appendChild(pre);
    container.prepend(box);
}

function renderPrescriptionBoxes(container, data) {
    const { result } = data;
    container.innerHTML = '';

    const boxes = [
        { title: 'Medicine Names', content: (result.medicines || []).map(m => `${m.brand || ''}${m.brand && m.generic ? ' → ' : ''}${m.generic || ''}`).filter(Boolean).join('\n') || '—' },
        { title: 'Indication', content: result.indication || '—' },
        { title: 'Generic Alternatives', content: (result.generics || []).join(', ') || '—' },
        { title: 'Estimated Stage/Severity', content: result.stage || '—' }
    ];

    for (const b of boxes) {
        const box = document.createElement('div');
        box.className = 'card-box';
        const h = document.createElement('h3');
        h.textContent = b.title;
        const p = document.createElement('pre');
        p.textContent = b.content;
        box.appendChild(h);
        box.appendChild(p);
        container.appendChild(box);
    }
}

function renderReportBoxes(container, data) {
    const { result } = data;
    container.innerHTML = '';

    const abnormalities = Array.isArray(result.abnormalities)
        ? result.abnormalities.map(a => `${a.test || ''}: ${a.value || ''} (${a.range || ''}) ${a.flag ? '[' + a.flag + ']' : ''}`).filter(Boolean).join('\n')
        : '';

    const boxes = [
        { title: 'Likely Diseases', content: (result.diseases || []).join(', ') || '—' },
        { title: 'Stage/Severity', content: result.stage || '—' },
        { title: 'Abnormal Values', content: abnormalities || '—' }
    ];

    for (const b of boxes) {
        const box = document.createElement('div');
        box.className = 'card-box';
        const h = document.createElement('h3');
        h.textContent = b.title;
        const p = document.createElement('pre');
        p.textContent = b.content;
        box.appendChild(h);
        box.appendChild(p);
        container.appendChild(box);
    }
}

// Camera functionality
class CameraManager {
    constructor(type) {
        this.type = type;
        this.stream = null;
        this.capturedImages = [];
        this.setupElements();
        this.setupEventListeners();
    }

    setupElements() {
        this.video = document.getElementById(`${this.type}Camera`);
        this.canvas = document.getElementById(`${this.type}Canvas`);
        this.startBtn = document.getElementById(`${this.type}StartCamera`);
        this.captureBtn = document.getElementById(`${this.type}Capture`);
        this.retakeBtn = document.getElementById(`${this.type}Retake`);
        this.closeBtn = document.getElementById(`${this.type}CloseCamera`);
        this.preview = document.getElementById(`${this.type}Preview`);
        this.previewImg = document.getElementById(`${this.type}PreviewImg`);
        this.capturedContainer = document.getElementById('reportCapturedImages');
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startCamera());
        this.captureBtn.addEventListener('click', () => this.capturePhoto());
        this.retakeBtn.addEventListener('click', () => this.retake());
        this.closeBtn.addEventListener('click', () => this.closeCamera());
    }

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            this.video.srcObject = this.stream;
            this.video.style.display = 'block';
            this.startBtn.style.display = 'none';
            this.captureBtn.style.display = 'inline-block';
        } catch (err) {
            alert('Camera access denied: ' + err.message);
        }
    }

    capturePhoto() {
        if (!this.stream) return;

        const context = this.canvas.getContext('2d');
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        context.drawImage(this.video, 0, 0);

        const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
        
        if (this.type === 'prescription') {
            this.previewImg.src = imageData;
            this.preview.style.display = 'block';
            this.video.style.display = 'none';
            this.captureBtn.style.display = 'none';
            this.retakeBtn.style.display = 'inline-block';
            this.closeBtn.style.display = 'inline-block';
            
            // Convert to file and set in form
            this.dataURLtoFile(imageData, 'prescription-capture.jpg').then(file => {
                const input = document.getElementById('prescriptionFile');
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
            });
        } else {
            // For reports, add to captured images array
            this.capturedImages.push(imageData);
            this.updateCapturedImagesDisplay();
            
            // Continue capturing or allow retake/close
            this.retakeBtn.style.display = 'inline-block';
            this.closeBtn.style.display = 'inline-block';
        }
    }

    retake() {
        if (this.type === 'prescription') {
            this.preview.style.display = 'none';
            this.video.style.display = 'block';
            this.captureBtn.style.display = 'inline-block';
            this.retakeBtn.style.display = 'none';
            this.closeBtn.style.display = 'none';
        } else {
            // For reports, clear last captured image
            if (this.capturedImages.length > 0) {
                this.capturedImages.pop();
                this.updateCapturedImagesDisplay();
            }
            this.retakeBtn.style.display = 'none';
            this.closeBtn.style.display = 'none';
        }
    }

    updateCapturedImagesDisplay() {
        if (!this.capturedContainer) return;
        
        this.capturedContainer.innerHTML = '';
        this.capturedImages.forEach((imgData, index) => {
            const img = document.createElement('img');
            img.src = imgData;
            img.alt = `Captured image ${index + 1}`;
            this.capturedContainer.appendChild(img);
        });
    }

    async dataURLtoFile(dataURL, filename) {
        const response = await fetch(dataURL);
        const blob = await response.blob();
        return new File([blob], filename, { type: 'image/jpeg' });
    }

    closeCamera() {
        this.stopCamera();
        this.video.style.display = 'none';
        this.preview.style.display = 'none';
        this.captureBtn.style.display = 'none';
        this.retakeBtn.style.display = 'none';
        this.closeBtn.style.display = 'none';
        this.startBtn.style.display = 'inline-block';
        
        // Clear captured images for reports
        if (this.type === 'report') {
            this.capturedImages = [];
            this.updateCapturedImagesDisplay();
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const formPrescription = document.getElementById('formPrescription');
    const prescriptionLoading = document.getElementById('prescriptionLoading');
    const prescriptionResult = document.getElementById('prescriptionResult');

    const formReport = document.getElementById('formReport');
    const reportLoading = document.getElementById('reportLoading');
    const reportResult = document.getElementById('reportResult');

    const btnLoadHistory = document.getElementById('btnLoadHistory');
    const historyDiv = document.getElementById('history');

    // Initialize camera managers
    const prescriptionCamera = new CameraManager('prescription');
    const reportCamera = new CameraManager('report');

    // TTS functionality using Web Speech API
    const prescriptionTTSBtn = document.getElementById('prescriptionTTSBtn');
    const prescriptionTTSControls = document.getElementById('prescriptionTTSControls');
    
    const reportTTSBtn = document.getElementById('reportTTSBtn');
    const reportTTSControls = document.getElementById('reportTTSControls');

    // Store latest results for TTS
    let latestPrescriptionResult = null;
    let latestReportResult = null;

    // Check if TTS is supported
    const isTTSSupported = 'speechSynthesis' in window;
    if (!isTTSSupported) {
        console.warn('Web Speech API not supported in this browser');
    }

    // Initialize TTS on page load
    if (isTTSSupported) {
        // Force voice loading
        speechSynthesis.getVoices();
        speechSynthesis.onvoiceschanged = () => {
            const voices = speechSynthesis.getVoices();
            console.log('TTS initialized with voices:', voices.length);
        };
    }

    formPrescription.addEventListener('submit', async (e) => {
        e.preventDefault();
        prescriptionLoading.hidden = false;
        try {
            const fd = new FormData(formPrescription);
            const selectedLang = document.getElementById('prescriptionLang').value;
            console.log('Frontend - Selected language for prescription:', selectedLang);
            console.log('Frontend - FormData entries:');
            for (let [key, value] of fd.entries()) {
                console.log(key, ':', value);
            }
            const data = await postForm('/api/prescriptions/analyze', fd);
            
            // Check for wrong image type error
            if (data.result && data.result.error === 'wrong_image_type') {
                alert('❌ Wrong Image Type: ' + data.result.message);
                prescriptionResult.innerHTML = '';
                prescriptionTTSControls.style.display = 'none';
                return;
            }
            
            // Store result for TTS
            latestPrescriptionResult = data;
            
            renderPrescriptionBoxes(prescriptionResult, data);
            
            // Show TTS controls
            prescriptionTTSControls.style.display = 'block';
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            prescriptionLoading.hidden = true;
        }
    });

    formReport.addEventListener('submit', async (e) => {
        e.preventDefault();
        reportLoading.hidden = false;
        try {
            const fd = new FormData();
            
            // Add captured images if any
            if (reportCamera.capturedImages.length > 0) {
                for (let i = 0; i < reportCamera.capturedImages.length; i++) {
                    const file = await reportCamera.dataURLtoFile(reportCamera.capturedImages[i], `report-capture-${i}.jpg`);
                    fd.append('files', file);
                }
            } else {
                // Use uploaded files
                const files = document.getElementById('reportFiles').files;
                for (const f of files) fd.append('files', f);
            }
            
            const selectedLang = document.getElementById('reportLang').value;
            fd.append('lang', selectedLang);
            console.log('Frontend - Selected language for report:', selectedLang);
            console.log('Frontend - FormData entries:');
            for (let [key, value] of fd.entries()) {
                console.log(key, ':', value);
            }
            const data = await postForm('/api/reports/analyze', fd);
            
            // Check for wrong image type error
            if (data.result && data.result.error === 'wrong_image_type') {
                alert('❌ Wrong Image Type: ' + data.result.message);
                reportResult.innerHTML = '';
                reportTTSControls.style.display = 'none';
                return;
            }
            
            // Store result for TTS
            latestReportResult = data;
            
            renderReportBoxes(reportResult, data);
            
            // Show TTS controls
            reportTTSControls.style.display = 'block';
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            reportLoading.hidden = true;
        }
    });

    async function loadHistory() {
        const res = await fetch('/api/history');
        const json = await res.json();
        historyDiv.innerHTML = '';
        for (const item of json) {
            const box = document.createElement('div');
            box.className = 'card-box';
            const h = document.createElement('h3');
            h.textContent = `${item.type.toUpperCase()} — ${new Date(item.createdAt).toLocaleString()}`;
            const p = document.createElement('pre');
            const s = item.summary || {};
            
            if (item.type === 'prescription') {
                // Display prescription data
                const medicines = Array.isArray(s.medicines) ? s.medicines.map(m => (m.brand || '') + (m.brand && m.generic ? ' → ' : '') + (m.generic || '')).filter(Boolean).join(', ') : '';
                const indication = typeof s.indication === 'string' ? s.indication : '';
                const generics = Array.isArray(s.generics) ? s.generics.join(', ') : '';
                const stage = typeof s.stage === 'string' ? s.stage : '';
                p.textContent = `Medicines: ${medicines || '—'}\nIndication: ${indication || '—'}\nGenerics: ${generics || '—'}\nStage: ${stage || '—'}`;
            } else if (item.type === 'report') {
                // Display report data
                const diseases = Array.isArray(s.diseases) ? s.diseases.join(', ') : '';
                const stage = typeof s.stage === 'string' ? s.stage : '';
                const abnormalities = Array.isArray(s.abnormalities) ? s.abnormalities.map(a => `${a.test || ''}: ${a.value || ''} (${a.range || ''}) ${a.flag ? '[' + a.flag + ']' : ''}`).filter(Boolean).join('\n') : '';
                p.textContent = `Diseases: ${diseases || '—'}\nStage: ${stage || '—'}\nAbnormalities: ${abnormalities || '—'}`;
            } else {
                // Fallback for unknown types
                p.textContent = JSON.stringify(s, null, 2);
            }
            
            box.appendChild(h);
            box.appendChild(p);
            historyDiv.appendChild(box);
        }
    }
    btnLoadHistory.addEventListener('click', loadHistory);
    loadHistory();

    // TTS Event Listeners
    prescriptionTTSBtn.addEventListener('click', () => generatePrescriptionTTS());
    reportTTSBtn.addEventListener('click', () => generateReportTTS());

    // TTS Functions using Web Speech API
    function generatePrescriptionTTS() {
        if (!latestPrescriptionResult) {
            alert('No prescription analysis available for TTS');
            return;
        }

        try {
            prescriptionTTSBtn.disabled = true;
            prescriptionTTSBtn.textContent = '🔄 Speaking...';

            const result = latestPrescriptionResult.result;
            const language = document.getElementById('prescriptionLang').value;
            
            // Create text summary for TTS
            const medicines = result.medicines || [];
            const indication = result.indication || '';
            const generics = result.generics || [];
            const stage = result.stage || '';
            
            // Format text based on language
            let text = '';
            if (language === 'hi') {
                text = 'आपकी दवाओं का विश्लेषण: ';
                if (medicines.length > 0) {
                    const medText = medicines.map(m => `${m.brand || ''} ${m.generic || ''}`.trim()).filter(Boolean).join(', ');
                    text += `दवाएं: ${medText}. `;
                }
                if (indication && indication !== 'unknown') {
                    text += `रोग: ${indication}. `;
                }
                if (generics.length > 0) {
                    const genText = generics.join(', ');
                    text += `जेनेरिक विकल्प: ${genText}. `;
                }
                if (stage && stage !== 'unknown') {
                    text += `गंभीरता: ${stage}.`;
                }
            } else if (language === 'mr') {
                text = 'तुमच्या औषधांचे विश्लेषण: ';
                if (medicines.length > 0) {
                    const medText = medicines.map(m => `${m.brand || ''} ${m.generic || ''}`.trim()).filter(Boolean).join(', ');
                    text += `औषधे: ${medText}. `;
                }
                if (indication && indication !== 'unknown') {
                    text += `रोग: ${indication}. `;
                }
                if (generics.length > 0) {
                    const genText = generics.join(', ');
                    text += `जेनेरिक पर्याय: ${genText}. `;
                }
                if (stage && stage !== 'unknown') {
                    text += `गंभीरता: ${stage}.`;
                }
            } else { // English
                text = 'Your prescription analysis: ';
                if (medicines.length > 0) {
                    const medText = medicines.map(m => `${m.brand || ''} ${m.generic || ''}`.trim()).filter(Boolean).join(', ');
                    text += `Medicines: ${medText}. `;
                }
                if (indication && indication !== 'unknown') {
                    text += `Condition: ${indication}. `;
                }
                if (generics.length > 0) {
                    const genText = generics.join(', ');
                    text += `Generic alternatives: ${genText}. `;
                }
                if (stage && stage !== 'unknown') {
                    text += `Severity: ${stage}.`;
                }
            }

            // Use AI4Bharat TTS
            speakWithAI4Bharat(text, language);

        } catch (error) {
            console.error('TTS Error:', error);
            alert('TTS generation failed. Please try again.');
        } finally {
            prescriptionTTSBtn.disabled = false;
            prescriptionTTSBtn.textContent = '🔊 Listen to Analysis';
        }
    }

    function generateReportTTS() {
        if (!latestReportResult) {
            alert('No report analysis available for TTS');
            return;
        }

        try {
            reportTTSBtn.disabled = true;
            reportTTSBtn.textContent = '🔄 Speaking...';

            const result = latestReportResult.result;
            const language = document.getElementById('reportLang').value;
            
            // Create text summary for TTS
            const diseases = result.diseases || [];
            const stage = result.stage || '';
            const abnormalities = result.abnormalities || [];
            
            // Format text based on language
            let text = '';
            if (language === 'hi') {
                text = 'आपकी लैब रिपोर्ट का विश्लेषण: ';
                if (diseases.length > 0) {
                    const disText = diseases.join(', ');
                    text += `संभावित रोग: ${disText}. `;
                }
                if (stage && stage !== 'unknown') {
                    text += `गंभीरता: ${stage}. `;
                }
                if (abnormalities.length > 0) {
                    const abText = abnormalities.slice(0, 3).map(a => `${a.test || ''}: ${a.value || ''}`).join(', ');
                    text += `असामान्य मूल्य: ${abText}.`;
                }
            } else if (language === 'mr') {
                text = 'तुमच्या लॅब रिपोर्टचे विश्लेषण: ';
                if (diseases.length > 0) {
                    const disText = diseases.join(', ');
                    text += `संभाव्य रोग: ${disText}. `;
                }
                if (stage && stage !== 'unknown') {
                    text += `गंभीरता: ${stage}. `;
                }
                if (abnormalities.length > 0) {
                    const abText = abnormalities.slice(0, 3).map(a => `${a.test || ''}: ${a.value || ''}`).join(', ');
                    text += `असामान्य मूल्ये: ${abText}.`;
                }
            } else { // English
                text = 'Your lab report analysis: ';
                if (diseases.length > 0) {
                    const disText = diseases.join(', ');
                    text += `Likely diseases: ${disText}. `;
                }
                if (stage && stage !== 'unknown') {
                    text += `Severity: ${stage}. `;
                }
                if (abnormalities.length > 0) {
                    const abText = abnormalities.slice(0, 3).map(a => `${a.test || ''}: ${a.value || ''}`).join(', ');
                    text += `Abnormal values: ${abText}.`;
                }
            }

            // Use AI4Bharat TTS
            speakWithAI4Bharat(text, language);

        } catch (error) {
            console.error('TTS Error:', error);
            alert('TTS generation failed. Please try again.');
        } finally {
            reportTTSBtn.disabled = false;
            reportTTSBtn.textContent = '🔊 Listen to Analysis';
        }
    }

    // AI4Bharat TTS function
    async function speakWithAI4Bharat(text, language) {
        try {
            console.log(`Generating TTS with AI4Bharat: ${language}, text length: ${text.length}`);
            
            // Call our TTS API
            const response = await fetch('/api/tts/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    language: language
                })
            });

            if (response.ok) {
                console.log('AI4Bharat TTS response received successfully');
                
                // Get audio blob
                const audioBlob = await response.blob();
                console.log('Audio blob received, size:', audioBlob.size, 'bytes');
                
                if (audioBlob.size === 0) {
                    console.error('Audio blob is empty');
                    throw new Error('Empty audio blob received');
                }
                
                // Create audio element and play
                const audio = new Audio();
                
                // Set up event handlers before setting src
                audio.onloadstart = () => {
                    console.log('AI4Bharat TTS audio loading started');
                };
                
                audio.oncanplay = () => {
                    console.log('AI4Bharat TTS audio can play');
                };
                
                audio.onended = () => {
                    console.log('AI4Bharat TTS completed successfully');
                    URL.revokeObjectURL(audio.src); // Clean up
                };
                
                audio.onerror = (error) => {
                    console.error('AI4Bharat TTS audio error:', error);
                    console.error('Audio error details:', audio.error);
                    // Fallback to Web Speech API
                    console.log('Falling back to Web Speech API due to audio error');
                    speakText(text, language);
                };
                
                // Create object URL and set source
                const audioUrl = URL.createObjectURL(audioBlob);
                audio.src = audioUrl;
                
                console.log('Attempting to play AI4Bharat audio...');
                
                // Try to play the audio
                try {
                    await audio.play();
                    console.log('AI4Bharat TTS playback started successfully');
                } catch (playError) {
                    console.error('Audio play() failed:', playError);
                    // Fallback to Web Speech API
                    console.log('Falling back to Web Speech API due to play() failure');
                    speakText(text, language);
                }
                
            } else {
                const errorData = await response.json();
                console.log('TTS API error response:', errorData);
                
                if (errorData.fallback === 'web_speech_api') {
                    console.log('TTS API requested fallback to Web Speech API');
                    // Fallback to Web Speech API
                    speakText(text, language);
                } else {
                    console.error('TTS API failed with error:', errorData);
                    alert('TTS generation failed. Please try again.');
                }
            }
            
        } catch (error) {
            console.error('AI4Bharat TTS error:', error);
            console.log('Falling back to Web Speech API due to exception');
            // Fallback to Web Speech API
            speakText(text, language);
        }
    }

    // Web Speech API function (fallback)
    function speakText(text, language) {
        if (!isTTSSupported) {
            alert('Text-to-speech is not supported in this browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        try {
            console.log(`Web Speech API fallback for language: ${language}`);
            
            // Stop any current speech
            window.speechSynthesis.cancel();

            // Create speech utterance
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Set language and voice
            utterance.lang = getLanguageCode(language);
            utterance.rate = 0.9; // Slightly slower for better clarity
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Event handlers
            utterance.onstart = () => {
                console.log('TTS started');
            };

            utterance.onend = () => {
                console.log('TTS completed');
            };

            utterance.onerror = (event) => {
                console.error('Web Speech API TTS error:', event.error);
                console.error('TTS error details:', event);
                
                // Try to provide helpful error message
                if (event.error === 'interrupted') {
                    console.log('TTS was interrupted, this is usually not a critical error');
                } else {
                    alert(`Web Speech API failed: ${event.error}. Please try again.`);
                }
            };

            // Get available voices and try to find a suitable one
            let voices = speechSynthesis.getVoices();
            
            if (voices.length === 0) {
                // Wait for voices to load
                speechSynthesis.onvoiceschanged = () => {
                    voices = speechSynthesis.getVoices();
                    console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
                    setBestVoice(utterance, voices, language);
                    speechSynthesis.speak(utterance);
                };
            } else {
                console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
                setBestVoice(utterance, voices, language);
                speechSynthesis.speak(utterance);
            }

        } catch (error) {
            console.error('TTS setup error:', error);
            alert('TTS setup failed. Please try again.');
        }
    }

    // Helper function to get language code
    function getLanguageCode(language) {
        const languageMap = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'mr': 'mr-IN'
        };
        return languageMap[language] || 'en-US';
    }

    // Helper function to set the best available voice
    function setBestVoice(utterance, voices, language) {
        if (!voices || voices.length === 0) {
            console.warn('No voices available');
            return;
        }

        const targetLang = getLanguageCode(language);
        console.log('Target language:', targetLang);
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
        
        // Try to find a voice in the target language
        let bestVoice = voices.find(voice => 
            voice.lang.startsWith(targetLang.split('-')[0]) && 
            voice.lang.includes(targetLang.split('-')[1])
        );
        
        // Fallback to any voice in the target language
        if (!bestVoice) {
            bestVoice = voices.find(voice => 
                voice.lang.startsWith(targetLang.split('-')[0])
            );
        }
        
        // Fallback to default voice
        if (!bestVoice) {
            bestVoice = voices.find(voice => voice.default) || voices[0];
        }
        
        if (bestVoice) {
            utterance.voice = bestVoice;
            console.log('Selected voice:', bestVoice.name, 'for language:', bestVoice.lang);
        } else {
            console.warn('No suitable voice found, using default');
        }
    }
});


