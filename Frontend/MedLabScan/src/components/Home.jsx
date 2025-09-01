import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import TextType from './TextType';

const Home = () => {
  const navigate = useNavigate();

  const handlePrescriptionScan = () => {
    navigate('/prescription-scan');
  };

  const handleReportScan = () => {
    navigate('/report-scan');
  };

  const handleHistory = () => {
    navigate('/history');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white">
      <Navbar />
      
      {/* Header */}
      <header className="text-center py-24 bg-gradient-to-r from-purple-200 to-blue-200 relative overflow-hidden">
        {/* V-shaped bottom edge - two diagonal edges meeting in center */}
        <div className="absolute bottom-0 left-0 w-1/2 h-16 bg-white transform skew-y-2 origin-bottom-left"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-16 bg-white transform -skew-y-2 origin-bottom-right"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 drop-shadow-lg">
            <TextType 
              text={["MedScan", "AI-Powered Medical Scanner", "Smart Health Analysis"]}
              typingSpeed={75}
              deletingSpeed={50}
              pauseDuration={1500}
              showCursor={true}
              cursorCharacter="|"
              cursorBlinkDuration={0.5}
              variableSpeed={true}
              variableSpeedMin={60}
              variableSpeedMax={100}
            />
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto px-4 drop-shadow-md">
            AI-powered medical document scanner. Upload prescriptions or medical reports
            and get instant, easy-to-understand analysis.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Prescription Scanner */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-10 border border-gray-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Prescription Scanner</h2>
              <p className="text-gray-600 mb-8">
                Upload your prescription and get detailed information about medications, 
                their purposes, and alternative options.
              </p>
              <button 
                onClick={handlePrescriptionScan}
                className="bg-gradient-to-r from-purple-200 to-blue-200 hover:from-purple-300 hover:to-blue-300 text-gray-800 font-semibold py-3 px-8 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl border border-purple-300"
              >
                Scan Prescription
              </button>
            </div>
          </div>
          
          {/* Report Scanner */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-10 border border-gray-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Report Scanner</h2>
              <p className="text-gray-600 mb-8">
                Analyze your medical reports and understand test results, 
                potential conditions, and recommended actions.
              </p>
              <button 
                onClick={handleReportScan}
                className="bg-gradient-to-r from-purple-200 to-blue-200 hover:from-purple-300 hover:to-blue-300 text-gray-800 font-semibold py-3 px-8 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl border border-purple-300"
              >
                Scan Report
              </button>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-10 border border-gray-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Analysis History</h2>
              <p className="text-gray-600 mb-8">
                View your previous medical document analyses and track your health insights over time.
              </p>
              <button 
                onClick={handleHistory}
                className="bg-gradient-to-r from-green-200 to-teal-200 hover:from-green-300 hover:to-teal-300 text-gray-800 font-semibold py-3 px-8 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl border border-green-300"
              >
                View History
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Why Choose MedScan?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Instant Analysis</h3>
              <p className="text-gray-600">Get detailed insights within seconds of uploading your documents.</p>
          </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
        </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your medical documents are processed securely with complete privacy protection.</p>
      </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                  </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">AI-Powered</h3>
              <p className="text-gray-600">Advanced AI technology provides accurate and comprehensive medical insights.</p>
              </div>
            </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">
            © 2024 MedScan. This system provides informational summaries only. 
            Please consult a licensed doctor for medical advice.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;