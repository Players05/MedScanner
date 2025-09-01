import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import ApiService from '../services/api';

const History = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getHistory();
      setHistory(data || []);
    } catch (error) {
      console.error('Failed to load history:', error);
      setError('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type) => {
    if (type === 'prescription') {
      return '💊';
    } else if (type === 'report') {
      return '📋';
    }
    return '📄';
  };

  const getTypeLabel = (type) => {
    if (type === 'prescription') {
      return 'Prescription';
    } else if (type === 'report') {
      return 'Medical Report';
    }
    return 'Document';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white flex flex-col relative">
      <Navbar />
      
      {/* Title */}
      <div className="pt-8 pb-6 sm:pb-8 text-center px-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 tracking-wide">
          Analysis History
        </h1>
        <p className="text-gray-600 mt-2">View your previous medical document analyses</p>
      </div>

      {/* History List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex-1">
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading history...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadHistory}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors mr-2"
            >
              Retry
            </button>
            <button
              onClick={handleBack}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No History Yet</h3>
            <p className="text-gray-600 mb-4">Start by analyzing a prescription or medical report</p>
            <button
              onClick={handleBack}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item, index) => (
              <div key={item._id || index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 border border-gray-200 transition-shadow duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{getTypeIcon(item.type)}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {getTypeLabel(item.type)} Analysis
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.filename || 'Document'} • {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.type === 'prescription' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {item.type}
                  </span>
                </div>

                {/* Summary Preview */}
                {item.summary && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Summary:</h4>
                    {item.type === 'prescription' ? (
                      <div className="space-y-2 text-sm text-gray-700">
                        {item.summary.medicines && item.summary.medicines.length > 0 && (
                          <div>
                            <strong>Medicines:</strong> {item.summary.medicines.map(m => m.brand || m.generic).join(', ')}
                          </div>
                        )}
                        {item.summary.indication && (
                          <div>
                            <strong>Indication:</strong> {item.summary.indication}
                          </div>
                        )}
                        {item.summary.stage && (
                          <div>
                            <strong>Stage:</strong> {item.summary.stage}
                          </div>
                        )}
                      </div>
                    ) : item.type === 'report' ? (
                      <div className="space-y-2 text-sm text-gray-700">
                        {item.summary.diseases && item.summary.diseases.length > 0 && (
                          <div>
                            <strong>Diseases:</strong> {item.summary.diseases.join(', ')}
                          </div>
                        )}
                        {item.summary.stage && (
                          <div>
                            <strong>Stage:</strong> {item.summary.stage}
                          </div>
                        )}
                        {item.summary.abnormalities && item.summary.abnormalities.length > 0 && (
                          <div>
                            <strong>Abnormalities:</strong> {item.summary.abnormalities.length} detected
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600">Summary not available</p>
                    )}
                  </div>
                )}

                {/* Language Info */}
                {item.summary?.language && (
                  <div className="mt-3 text-xs text-gray-500">
                    Language: {item.summary.language === 'en' ? 'English' : 
                               item.summary.language === 'hi' ? 'हिन्दी' : 
                               item.summary.language === 'mr' ? 'मराठी' : item.summary.language}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="p-6 text-center">
        <button
          onClick={handleBack}
          className="px-8 py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default History;
