import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import ApiService from '../services/api';

const InfoBox = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Try to get data from navigation state first
    if (location.state?.result) {
      setPrescriptionData(location.state.result);
      setIsLoading(false);
    } else {
      // Fallback to localStorage
      const stored = localStorage.getItem('prescriptionResult');
      if (stored) {
        try {
          setPrescriptionData(JSON.parse(stored));
        } catch (e) {
          setError('Failed to load prescription data');
        }
      } else {
        setError('No prescription data found');
      }
      setIsLoading(false);
    }
  }, [location.state]);
  
  const handleBack = () => {
    navigate('/');
  };

  const handleSpeak = async () => {
    if (!prescriptionData) return;
    
    const currentLanguage = prescriptionData.language || 'en';
    
    // Check if TTS is supported for this language
    if (currentLanguage !== 'en') {
      const languageName = currentLanguage === 'hi' ? 'Hindi' : 'Marathi';
      alert(`Text-to-speech is not supported for ${languageName}. Only English is supported.`);
      return;
    }
    
    try {
      // Create a summary text for TTS
      const summaryText = `Medicine: ${prescriptionData.medicines?.map(m => m.brand || m.generic).join(', ') || 'Unknown'}. 
        Indication: ${prescriptionData.indication || 'Unknown'}. 
        Stage: ${prescriptionData.stage || 'Unknown'}. 
        Generic alternatives: ${prescriptionData.generics?.join(', ') || 'None available'}`;
      
      await ApiService.textToSpeech(summaryText, 'en');
      
      // Show success message
      const button = document.querySelector('[aria-label="Listen to prescription details"]');
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '🔊 Playing...';
        button.disabled = true;
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
        }, 3000);
      }
    } catch (error) {
      console.error('TTS failed:', error);
      
      if (error.message.includes('not supported')) {
        alert(error.message);
      } else {
        alert('Text-to-speech failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white flex flex-col relative">
      <Navbar />
      
      {/* Title - Top Center */}
      <div className="pt-8 pb-6 sm:pb-8 text-center px-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 tracking-wide">
          Prescription Analysis
        </h1>
        <p className="text-gray-600 mt-2">AI-powered medicine information</p>
      </div>

      {/* Prescription Box */}
      <div className="max-w-sm sm:max-w-md lg:max-w-lg mx-auto px-4 sm:px-6 lg:px-8 flex-1">
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading prescription data...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Error</h3>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={handleBack}
              className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : prescriptionData ? (
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 sm:p-8 text-gray-800 border border-gray-200 transition-shadow duration-300">
            {/* Medicine Details */}
            <div className="space-y-4">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-700 tracking-wide">
                  Medicine Details
                </h2>
              </div>

              {/* Tabular Form */}
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50">Medicine Name</td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {prescriptionData.medicines && prescriptionData.medicines.length > 0 ? (
                          prescriptionData.medicines.map((med, index) => (
                            <div key={index} className="mb-2">
                              {med.brand && <div><strong>Brand:</strong> {med.brand}</div>}
                              {med.generic && <div><strong>Generic:</strong> {med.generic}</div>}
                            </div>
                          ))
                        ) : (
                          'No medicine information available'
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50">Indication</td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {prescriptionData.indication || 'No indication information available'}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50">Disease Stage</td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          prescriptionData.stage === 'severe' || prescriptionData.stage === 'critical' 
                            ? 'bg-red-100 text-red-800'
                            : prescriptionData.stage === 'moderate'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {prescriptionData.stage || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50">Generic Alternatives</td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {prescriptionData.generics && prescriptionData.generics.length > 0 ? (
                          prescriptionData.generics.join(', ')
                        ) : (
                          'No generic alternatives available'
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Speaker Button - Absolute positioned */}
      <button
        onClick={handleSpeak}
        disabled={prescriptionData?.language && prescriptionData.language !== 'en'}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center z-50 ${
          prescriptionData?.language && prescriptionData.language !== 'en'
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 hover:shadow-xl'
        }`}
        aria-label={
          prescriptionData?.language && prescriptionData.language !== 'en'
            ? `Text-to-speech not supported for ${prescriptionData.language === 'hi' ? 'Hindi' : 'Marathi'}`
            : 'Listen to prescription details'
        }
        title={
          prescriptionData?.language && prescriptionData.language !== 'en'
            ? `Text-to-speech not supported for ${prescriptionData.language === 'hi' ? 'Hindi' : 'Marathi'}. Only English is supported.`
            : 'Click to listen to prescription details'
        }
      >
        {prescriptionData?.language && prescriptionData.language !== 'en' ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>
      
      {/* Language Restriction Notice */}
      {prescriptionData?.language && prescriptionData.language !== 'en' && (
        <div className="fixed bottom-24 right-6 max-w-xs bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg z-50">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Text-to-Speech:</strong> Not available for {prescriptionData.language === 'hi' ? 'Hindi' : 'Marathi'}. Only English is supported.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoBox;
