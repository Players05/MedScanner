import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotlightCard from './SpotlightCard';
import Navbar from './Navbar';
import ApiService from '../services/api';

function RepoScan() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const onFileChange = useCallback((event) => {
    const nextFile = event.target.files && event.target.files[0];
    if (nextFile) setFile(nextFile);
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
    const nextFile = event.dataTransfer.files && event.dataTransfer.files[0];
    if (nextFile) setFile(nextFile);
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onKeyActivate = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  React.useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const handleProcessReport = async () => {
    if (!file) return;
    
    // Show language selection modal first
    setShowLanguageModal(true);
  };

  const handleLanguageConfirm = async () => {
    setShowLanguageModal(false);
    setIsProcessing(true);
    
    try {
      // Debug: Log file information before sending
      console.log('Processing file for analysis:');
      console.log('File object:', file);
      console.log('File name:', file?.name);
      console.log('File size:', file?.size);
      console.log('File type:', file?.type);
      console.log('Selected language:', selectedLanguage);
      
      if (!file) {
        throw new Error('No file selected for analysis');
      }
      
      // Call the backend API
      const result = await ApiService.analyzeReport(file, selectedLanguage);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log('Analysis result:', result);
      
      // Store the result in localStorage or pass via navigation state
      localStorage.setItem('reportResult', JSON.stringify(result.result));
      
      // Navigate to InfoReports after successful processing
      navigate('/inforeports', { state: { result: result.result } });
    } catch (error) {
      console.error('Report analysis failed:', error);
      alert(`Analysis failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const startCamera = async () => {
    try {
      // First set the state to show camera interface
      setShowCamera(true);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      setCameraStream(stream);
      
      // Wait for video to be ready
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video loads before allowing capture
        videoRef.current.onloadedmetadata = () => {
          console.log('Camera ready for capture');
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setShowCamera(false); // Hide camera interface on error
      alert('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCapturedImage(null);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Ensure video is playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        alert('Camera not ready yet. Please wait a moment and try again.');
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a proper file object for analysis
          const capturedFile = new File([blob], `camera-capture-${Date.now()}.jpg`, { 
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          console.log('Captured image file:', capturedFile);
          console.log('File size:', capturedFile.size, 'bytes');
          console.log('File type:', capturedFile.type);
          
          // Set the file for analysis
          setFile(capturedFile);
          setCapturedImage(URL.createObjectURL(blob));
          
          // Stop camera after successful capture
          stopCamera();
          
          // Show success message
          alert('Image captured successfully! You can now process it.');
        } else {
          alert('Failed to capture image. Please try again.');
        }
      }, 'image/jpeg', 0.9); // Higher quality
    } else {
      alert('Camera not ready. Please try again.');
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setFile(null);
    startCamera();
  };

  const useCapturedImage = () => {
    if (file) {
      // Ensure the captured image is properly set for processing
      console.log('Using captured image for analysis:', file);
      setCapturedImage(null); // Hide the preview
      // The file is already set, so user can now click "Process Report"
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' }
  ];

  return (
    <div className="min-h-screen bg-teal-50 text-slate-900">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {/* Header (glassmorphism) */}
        <header className={`mx-auto mb-8 sm:mb-12 w-full max-w-5xl rounded-2xl bg-white/50 p-6 sm:p-8 text-left shadow-sm ring-1 ring-black/5 backdrop-blur transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <h1 className="text-center text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900/90">Report Scanner</h1>
          <p className="mt-3 text-center text-base sm:text-lg lg:text-xl text-slate-600">Easily understand your medical report in a clear, simple way.</p>
        </header>

        {/* Upload section - two separate boxes for each feature */}
        <section aria-labelledby="upload-title" aria-describedby="upload-desc">
          <h2 id="upload-title" className="sr-only">Upload or scan medical report</h2>
          <p id="upload-desc" className="sr-only">Use your camera or upload a JPG, PNG, or PDF.</p>
          <div className={`mx-auto max-w-5xl transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              {/* Camera Card */}
              <SpotlightCard className="rounded-2xl bg-white/90 p-4 sm:p-6 md:p-8 lg:p-10 shadow-xl ring-1 ring-black/5 backdrop-blur h-full" spotlightColor="rgba(56, 189, 248, 0.18)">
                <div className="flex flex-col items-center justify-center text-center min-h-[250px] sm:min-h-[300px]">
                  <div className="relative">
                    <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-tr from-teal-400/25 via-cyan-300/20 to-violet-400/25 blur-xl animate-pulse" aria-hidden="true" />
                    <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 shadow-lg ring-1 ring-teal-200">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 128 96"
                        className="h-12 w-16 sm:h-16 sm:w-20"
                        role="img"
                        aria-label="Camera icon"
                      >
                        <rect x="4" y="10" rx="10" ry="10" width="120" height="80" fill="#ffffff" stroke="#1f1531" strokeWidth="4" />
                        <path d="M64 90H16c-6.627 0-12-5.373-12-12V20c0-1.1.9-2 2-2h58v72z" fill="#ffffff" opacity="1" />
                        <path d="M64 90h48c6.627 0 12-5.373 12-12V20c0-1.1-.9-2-2-2H64v72z" fill="#b8b6c6" opacity="1" />
                        <rect x="8" y="12" width="112" height="26" rx="8" fill="#2c2a35" />
                        <rect x="18" y="6" width="24" height="16" rx="3" fill="#2c2a35" stroke="#1f1531" strokeWidth="4" />
                        <rect x="48" y="2" width="32" height="20" rx="4" fill="#2c2a35" stroke="#1f1531" strokeWidth="4" />
                        <circle cx="64" cy="56" r="28" fill="#2c2a35" stroke="#1f1531" strokeWidth="4" />
                        <circle cx="64" cy="56" r="20" fill="#2680c2" />
                        <circle cx="56" cy="48" r="6" fill="#ffffff" opacity="0.95" />
                        <circle cx="70" cy="54" r="3.8" fill="#ffffff" opacity="0.85" />
                        <circle cx="106" cy="34" r="9" fill="#ffffff" stroke="#1f1531" strokeWidth="4" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-4 text-sm sm:text-base text-slate-600">Use your device camera</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="mt-4 inline-flex items-center justify-center rounded-full bg-teal-600 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg transition hover:bg-teal-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-300"
                    aria-describedby="camera-help"
                  >
                    Scan with Camera
                  </button>
                  <span id="camera-help" className="mt-2 text-xs text-slate-500">Requires camera permission</span>
                </div>
              </SpotlightCard>

              {/* Upload Card */}
              <SpotlightCard className="rounded-2xl bg-white/90 p-4 sm:p-6 md:p-8 lg:p-10 shadow-xl ring-1 ring-black/5 backdrop-blur h-full" spotlightColor="rgba(56, 189, 248, 0.18)">
                <div className="flex items-center">
                  <div
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onClick={() => inputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={onKeyActivate}
                    aria-label="Drag & drop or click to upload JPG, PNG, or PDF"
                    className={`relative w-full rounded-xl p-4 sm:p-6 md:p-8 text-center transition shadow-inner ring-1 ${isDragging ? 'bg-teal-50 ring-teal-300' : 'bg-white ring-slate-200'} focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-300`}
                  >
                    <div className={`pointer-events-none absolute inset-0 rounded-xl border-2 border-dashed ${isDragging ? 'border-teal-400' : 'border-slate-300'}`} />
                    <div className="relative mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-8 w-8 sm:h-12 sm:w-12 text-teal-600" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V7m0 0-3 3m3-3 3 3M4 16.5V18a2 2 0 002 2h12a2 2 0 002-2v-1.5" />
                      </svg>
                    </div>
                    <div className="mt-4 text-lg sm:text-2xl font-semibold text-slate-900">Drag & drop</div>
                    <div className="mt-1 text-sm sm:text-base text-slate-700">or click to upload</div>
                    <div className="mt-2 text-xs text-slate-500">accepts JPG, PNG, PDF</div>
                    <input
                      id="file-input"
                      ref={inputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={onFileChange}
                      className="sr-only"
                    />
                  </div>
                </div>
              </SpotlightCard>
            </div>
          </div>
        </section>

        {/* Camera Interface */}
        {showCamera && (
          <div className={`mx-auto mt-4 sm:mt-6 max-w-3xl transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="bg-white/90 rounded-2xl p-6 shadow-xl ring-1 ring-black/5 backdrop-blur">
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-slate-900">Camera Scanner</h3>
                <p className="text-slate-600">Position your medical report in the frame</p>
              </div>
              
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg border-2 border-teal-200"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-teal-400 border-dashed rounded-lg w-64 h-40 opacity-50"></div>
                </div>
              </div>
              
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={captureImage}
                  className="px-6 py-3 bg-teal-600 text-white rounded-full font-semibold hover:bg-teal-700 transition-colors"
                >
                  📸 Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 bg-gray-600 text-white rounded-full font-semibold hover:bg-gray-700 transition-colors"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Captured Image Preview */}
        {capturedImage && (
          <div className={`mx-auto mt-4 sm:mt-6 max-w-3xl transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="bg-white/90 rounded-2xl p-6 shadow-xl ring-1 ring-black/5 backdrop-blur">
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-slate-900">Captured Image</h3>
                <p className="text-slate-600">Review your captured medical report</p>
              </div>
              
              <div className="flex justify-center mb-4">
                <img 
                  src={capturedImage} 
                  alt="Captured medical report" 
                  className="max-w-full h-auto rounded-lg border-2 border-teal-200 max-h-64"
                />
              </div>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={retakePhoto}
                  className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
                >
                  🔄 Retake
                </button>
                <button
                  onClick={useCapturedImage}
                  className="px-6 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors"
                >
                  ✅ Use This
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected file preview and actions */}
        {file && (
          <div className={`mx-auto mt-4 sm:mt-6 max-w-3xl transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="rounded-xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 text-slate-800">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-slate-500" aria-hidden="true">
                    <path d="M19.5 14.25v-6.75a2.25 2.25 0 00-2.25-2.25H8.25A2.25 2.25 0 006 7.5v9a2.25 2.25 0 002.25 2.25h6.75m4.5-4.5l-6 6m6-6h-3.75a2.25 2.25 0 00-2.25 2.25V21" />
                  </svg>
                  <span className="text-sm font-medium truncate">{file.name}</span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex-1 sm:flex-none rounded-md bg-gradient-to-r from-teal-500 to-violet-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    Change file
                  </button>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="flex-1 sm:flex-none rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              {/* Process Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleProcessReport}
                  disabled={isProcessing}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 sm:px-8 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    'Process Report'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary section (shown after file upload) */}
        {file && (
          <section aria-labelledby="summary-title" className="mt-6 sm:mt-8">
            <h2 id="summary-title" className="text-lg sm:text-xl font-semibold mb-4">Report Summary</h2>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <h3 className="font-medium text-gray-900 text-sm sm:text-base">Test Name & Purpose</h3>
                <p className="mt-2 text-xs sm:text-sm text-gray-700">Complete Blood Count — Evaluates overall health and detects a variety of disorders.</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <h3 className="font-medium text-gray-900 text-sm sm:text-base">Key Findings</h3>
                <p className="mt-2 text-xs sm:text-sm text-gray-700">Values within normal ranges. Consult your doctor if symptoms persist.</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <h3 className="font-medium text-gray-900 text-sm sm:text-base">Related Metrics</h3>
                <p className="mt-2 text-xs sm:text-sm text-gray-700">Hemoglobin, WBC, Platelets — All within expected limits.</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm sm:col-span-2">
                <h3 className="font-medium text-gray-900 text-sm sm:text-base">Simple Explanation</h3>
                <p className="mt-2 text-xs sm:text-sm text-gray-700">Your report appears normal. Maintain hydration, rest well, and follow your physician's advice.</p>
              </div>
            </div>
          </section>
        )}

        {/* Footer disclaimer */}
        <footer className="mt-8 sm:mt-10 border-t border-gray-200 pt-4 sm:pt-6 text-center text-xs text-gray-500">
          This system provides only informational summaries. Please consult a licensed doctor for medical advice.
        </footer>
      </div>

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Select Language</h3>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Choose your preferred language for the analysis:</p>
              
              <div className="space-y-2">
                {languages.map((lang) => (
                  <label key={lang.code} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="language"
                      value={lang.code}
                      checked={selectedLanguage === lang.code}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="mr-3 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-lg mr-2">{lang.flag}</span>
                    <span className="text-sm font-medium text-gray-900">{lang.name}</span>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowLanguageModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLanguageConfirm}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 rounded-md transition-all duration-200"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RepoScan;