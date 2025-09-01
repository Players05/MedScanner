const express = require('express');
const axios = require('axios');
const router = express.Router();

// AI4Bharat TTS service URL
const TTS_SERVICE_URL = 'http://localhost:5001';

// Check if TTS service is available
async function isTTSServiceAvailable() {
    try {
        const response = await axios.get(`${TTS_SERVICE_URL}/health`, { timeout: 2000 });
        return response.status === 200 && response.data.model_loaded;
    } catch (error) {
        console.log('TTS service not available:', error.message);
        return false;
    }
}

// Synthesize speech using AI4Bharat
async function synthesizeWithAI4Bharat(text, language) {
    try {
        console.log(`Synthesizing with AI4Bharat: ${language}, text length: ${text.length}`);
        
        const response = await axios.post(`${TTS_SERVICE_URL}/synthesize`, {
            text: text,
            language: language
        }, {
            responseType: 'arraybuffer',
            timeout: 30000 // 30 seconds timeout for TTS generation
        });
        
        return {
            success: true,
            audioData: response.data,
            contentType: response.headers['content-type']
        };
        
    } catch (error) {
        console.error('AI4Bharat TTS error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// TTS endpoint
router.post('/synthesize', async (req, res) => {
    try {
        const { text, language } = req.body;
        
        if (!text || !language) {
            return res.status(400).json({
                error: 'Missing text or language parameter'
            });
        }
        
        if (!['en', 'hi', 'mr'].includes(language)) {
            return res.status(400).json({
                error: 'Unsupported language. Use: en, hi, mr'
            });
        }
        
        console.log(`TTS request: language=${language}, text length=${text.length}`);
        
        // Check if AI4Bharat service is available
        const serviceAvailable = await isTTSServiceAvailable();
        
        if (serviceAvailable) {
            console.log('Using AI4Bharat TTS service');
            
            // Use AI4Bharat TTS
            const result = await synthesizeWithAI4Bharat(text, language);
            
            if (result.success) {
                // Return audio data
                res.set({
                    'Content-Type': result.contentType,
                    'Content-Disposition': `attachment; filename="speech_${language}.wav"`
                });
                res.send(result.audioData);
            } else {
                // Fallback to Web Speech API
                console.log('AI4Bharat failed, falling back to Web Speech API');
                res.json({
                    success: false,
                    fallback: 'web_speech_api',
                    message: 'AI4Bharat TTS failed, use Web Speech API instead'
                });
            }
        } else {
            // Service not available, fallback to Web Speech API
            console.log('TTS service not available, using Web Speech API fallback');
            res.json({
                success: false,
                fallback: 'web_speech_api',
                message: 'TTS service not available, use Web Speech API instead'
            });
        }
        
    } catch (error) {
        console.error('TTS route error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        const serviceAvailable = await isTTSServiceAvailable();
        
        res.json({
            status: 'healthy',
            ai4bharat_available: serviceAvailable,
            supported_languages: ['en', 'hi', 'mr'],
            fallback_available: true
        });
        
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        message: 'TTS route is working!',
        endpoints: {
            'POST /synthesize': 'Generate speech from text',
            'GET /health': 'Check TTS service health',
            'GET /test': 'Test endpoint'
        }
    });
});

module.exports = router;

