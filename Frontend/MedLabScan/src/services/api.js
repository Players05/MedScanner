const API_BASE_URL = '/api';

class ApiService {
  // Prescription Analysis
  static async analyzePrescription(file, language = 'en') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('lang', language);

    try {
      const response = await fetch(`${API_BASE_URL}/prescriptions/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Prescription analysis error:', error);
      throw error;
    }
  }

  // Report Analysis
  static async analyzeReport(files, language = 'en') {
    const formData = new FormData();
    
    // Handle both single file and multiple files
    if (Array.isArray(files)) {
      files.forEach(file => {
        formData.append('files', file);
      });
    } else {
      formData.append('files', files);
    }
    
    formData.append('lang', language);

    try {
      const response = await fetch(`${API_BASE_URL}/reports/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Report analysis error:', error);
      throw error;
    }
  }

  // Get History
  static async getHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/history`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get history error:', error);
      throw error;
    }
  }

  // Text-to-Speech using Web Speech API
  static async textToSpeech(text, language = 'en') {
    // Only support English for Web Speech API
    if (language !== 'en') {
      throw new Error(`Text-to-speech is not supported for ${language === 'hi' ? 'Hindi' : 'Marathi'}. Only English is supported.`);
    }

    // Check if Web Speech API is available
    if (!('speechSynthesis' in window)) {
      throw new Error('Text-to-speech is not supported in this browser.');
    }

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => resolve({ success: true });
        utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

        speechSynthesis.speak(utterance);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Health check
  static async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default ApiService;
