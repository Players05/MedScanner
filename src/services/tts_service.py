from flask import Flask, request, jsonify, send_file
from transformers import AutoModel, AutoTokenizer
import torch
import soundfile as sf
import io
import os
import tempfile
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Global variables for model and tokenizer
model = None
tokenizer = None
device = None

def load_model():
    """Load AI4Bharat VITS model and tokenizer"""
    global model, tokenizer, device
    
    try:
        logger.info("Loading AI4Bharat VITS model...")
        
        # Check if CUDA is available
        if torch.cuda.is_available():
            device = "cuda"
            logger.info("CUDA available, using GPU")
        else:
            device = "cpu"
            logger.info("CUDA not available, using CPU")
        
        # Load model and tokenizer
        model_name = "ai4bharat/vits_rasa_13"
        tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        model = AutoModel.from_pretrained(model_name, trust_remote_code=True).to(device)
        
        logger.info(f"Model loaded successfully on {device}")
        return True
        
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return False

def get_speaker_id(language):
    """Get appropriate speaker ID for the language"""
    speaker_mapping = {
        'en': 0,    # English speaker
        'hi': 16,   # Hindi speaker (PAN_M style)
        'mr': 17    # Marathi speaker
    }
    return speaker_mapping.get(language, 0)

def get_emotion_id():
    """Get emotion ID (0 for neutral)"""
    return 0

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'device': device
    })

@app.route('/synthesize', methods=['POST'])
def synthesize_speech():
    """Synthesize speech from text"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        text = data.get('text', '').strip()
        language = data.get('language', 'en').lower()
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        if language not in ['en', 'hi', 'mr']:
            return jsonify({'error': 'Unsupported language. Use: en, hi, mr'}), 400
        
        if model is None or tokenizer is None:
            return jsonify({'error': 'TTS model not loaded'}), 500
        
        logger.info(f"Synthesizing speech for language: {language}, text length: {len(text)}")
        
        # Get speaker and emotion IDs
        speaker_id = get_speaker_id(language)
        emotion_id = get_emotion_id()
        
        # Tokenize input text
        inputs = tokenizer(text, return_tensors="pt").to(device)
        
        # Generate speech
        logger.info(f"Generating speech with speaker_id: {speaker_id}, emotion_id: {emotion_id}")
        with torch.no_grad():
            outputs = model(inputs['input_ids'], speaker_id=speaker_id, emotion_id=emotion_id)
        
        # Convert to audio file
        audio_data = outputs.waveform.squeeze().cpu().numpy()
        sample_rate = model.config.sampling_rate
        
        logger.info(f"Audio data shape: {audio_data.shape}, sample rate: {sample_rate}")
        
        # Validate audio data
        if len(audio_data) == 0:
            raise ValueError("Generated audio data is empty")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            sf.write(temp_file.name, audio_data, sample_rate)
            temp_path = temp_file.name
        
        logger.info(f"Speech synthesized successfully. Audio length: {len(audio_data)} samples, saved to: {temp_path}")
        
        # Return audio file
        return send_file(
            temp_path,
            mimetype='audio/wav',
            as_attachment=True,
            download_name=f'speech_{language}.wav'
        )
        
    except Exception as e:
        logger.error(f"Error in speech synthesis: {str(e)}")
        return jsonify({'error': f'Speech synthesis failed: {str(e)}'}), 500

@app.route('/test', methods=['GET'])
def test_endpoint():
    """Test endpoint to verify service is running"""
    return jsonify({
        'message': 'AI4Bharat TTS Service is running!',
        'model_loaded': model is not None,
        'device': device,
        'supported_languages': ['en', 'hi', 'mr']
    })

if __name__ == '__main__':
    # Load model on startup
    if load_model():
        logger.info("Starting AI4Bharat TTS Service...")
        app.run(host='0.0.0.0', port=5001, debug=False)
    else:
        logger.error("Failed to load model. Service cannot start.")
        exit(1)
