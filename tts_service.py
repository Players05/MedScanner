from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import soundfile as sf
import io
import os
from transformers import AutoModel, AutoTokenizer
import torch

app = Flask(__name__)
CORS(app)

# Global variables for model and tokenizer
model = None
tokenizer = None

def load_model():
    """Load the TTS model and tokenizer"""
    global model, tokenizer
    try:
        print("Loading TTS model...")
        model = AutoModel.from_pretrained("ai4bharat/vits_rasa_13", trust_remote_code=True)
        if torch.cuda.is_available():
            model = model.to("cuda")
        else:
            model = model.to("cpu")
        tokenizer = AutoTokenizer.from_pretrained("ai4bharat/vits_rasa_13", trust_remote_code=True)
        print("TTS model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        raise e

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "model_loaded": model is not None})

@app.route('/tts', methods=['POST'])
def text_to_speech():
    """Convert text to speech"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        language = data.get('language', 'en')  # en, hi, mr
        speaker_id = data.get('speaker_id', 16)  # Default speaker
        style_id = data.get('style_id', 0)  # Default style
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        if model is None or tokenizer is None:
            return jsonify({"error": "TTS model not loaded"}), 500
        
        # Convert text to tensor
        device = "cuda" if torch.cuda.is_available() else "cpu"
        inputs = tokenizer(text=text, return_tensors="pt").to(device)
        
        # Generate speech
        with torch.no_grad():
            outputs = model(inputs['input_ids'], speaker_id=speaker_id, emotion_id=style_id)
        
        # Convert to audio file
        audio_data = outputs.waveform.squeeze().cpu().numpy()
        sample_rate = model.config.sampling_rate
        
        # Save to memory buffer
        audio_buffer = io.BytesIO()
        sf.write(audio_buffer, audio_data, sample_rate, format='WAV')
        audio_buffer.seek(0)
        
        return send_file(
            audio_buffer,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='speech.wav'
        )
        
    except Exception as e:
        print(f"TTS Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/tts-prescription', methods=['POST'])
def tts_prescription():
    """Generate TTS for prescription analysis results"""
    try:
        data = request.get_json()
        result = data.get('result', {})
        language = data.get('language', 'en')
        
        # Create text summary for TTS
        medicines = result.get('medicines', [])
        indication = result.get('indication', '')
        generics = result.get('generics', [])
        stage = result.get('stage', '')
        
        # Format text based on language
        if language == 'hi':
            text = f"आपकी दवाओं का विश्लेषण: "
            if medicines:
                med_text = ", ".join([f"{m.get('brand', '')} {m.get('generic', '')}".strip() for m in medicines])
                text += f"दवाएं: {med_text}. "
            if indication:
                text += f"रोग: {indication}. "
            if generics:
                gen_text = ", ".join(generics)
                text += f"जेनेरिक विकल्प: {gen_text}. "
            if stage:
                text += f"गंभीरता: {stage}."
        elif language == 'mr':
            text = f"तुमच्या औषधांचे विश्लेषण: "
            if medicines:
                med_text = ", ".join([f"{m.get('brand', '')} {m.get('generic', '')}".strip() for m in medicines])
                text += f"औषधे: {med_text}. "
            if indication:
                text += f"रोग: {indication}. "
            if generics:
                gen_text = ", ".join(generics)
                text += f"जेनेरिक पर्याय: {gen_text}. "
            if stage:
                text += f"गंभीरता: {stage}."
        else:  # English
            text = f"Your prescription analysis: "
            if medicines:
                med_text = ", ".join([f"{m.get('brand', '')} {m.get('generic', '')}".strip() for m in medicines])
                text += f"Medicines: {med_text}. "
            if indication:
                text += f"Condition: {indication}. "
            if generics:
                gen_text = ", ".join(generics)
                text += f"Generic alternatives: {gen_text}. "
            if stage:
                text += f"Severity: {stage}."
        
        # Generate speech
        device = "cuda" if torch.cuda.is_available() else "cpu"
        inputs = tokenizer(text=text, return_tensors="pt").to(device)
        
        with torch.no_grad():
            outputs = model(inputs['input_ids'], speaker_id=16, emotion_id=0)
        
        audio_data = outputs.waveform.squeeze().cpu().numpy()
        sample_rate = model.config.sampling_rate
        
        audio_buffer = io.BytesIO()
        sf.write(audio_buffer, audio_data, sample_rate, format='WAV')
        audio_buffer.seek(0)
        
        return send_file(
            audio_buffer,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='prescription_analysis.wav'
        )
        
    except Exception as e:
        print(f"Prescription TTS Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/tts-report', methods=['POST'])
def tts_report():
    """Generate TTS for lab report analysis results"""
    try:
        data = request.get_json()
        result = data.get('result', {})
        language = data.get('language', 'en')
        
        # Create text summary for TTS
        diseases = result.get('diseases', [])
        stage = result.get('stage', '')
        abnormalities = result.get('abnormalities', [])
        
        # Format text based on language
        if language == 'hi':
            text = f"आपकी लैब रिपोर्ट का विश्लेषण: "
            if diseases:
                dis_text = ", ".join(diseases)
                text += f"संभावित रोग: {dis_text}. "
            if stage:
                text += f"गंभीरता: {stage}. "
            if abnormalities:
                ab_text = ", ".join([f"{a.get('test', '')}: {a.get('value', '')}" for a in abnormalities[:3]])
                text += f"असामान्य मूल्य: {ab_text}."
        elif language == 'mr':
            text = f"तुमच्या लॅब रिपोर्टचे विश्लेषण: "
            if diseases:
                dis_text = ", ".join(diseases)
                text += f"संभाव्य रोग: {dis_text}. "
            if stage:
                text += f"गंभीरता: {stage}. "
            if abnormalities:
                ab_text = ", ".join([f"{a.get('test', '')}: {a.get('value', '')}" for a in abnormalities[:3]])
                text += f"असामान्य मूल्ये: {ab_text}."
        else:  # English
            text = f"Your lab report analysis: "
            if diseases:
                dis_text = ", ".join(diseases)
                text += f"Likely diseases: {dis_text}. "
            if stage:
                text += f"Severity: {stage}. "
            if abnormalities:
                ab_text = ", ".join([f"{a.get('test', '')}: {a.get('value', '')}" for a in abnormalities[:3]])
                text += f"Abnormal values: {ab_text}."
        
        # Generate speech
        device = "cuda" if torch.cuda.is_available() else "cpu"
        inputs = tokenizer(text=text, return_tensors="pt").to(device)
        
        with torch.no_grad():
            outputs = model(inputs['input_ids'], speaker_id=16, emotion_id=0)
        
        audio_data = outputs.waveform.squeeze().cpu().numpy()
        sample_rate = model.config.sampling_rate
        
        audio_buffer = io.BytesIO()
        sf.write(audio_buffer, audio_data, sample_rate, format='WAV')
        audio_buffer.seek(0)
        
        return send_file(
            audio_buffer,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='report_analysis.wav'
        )
        
    except Exception as e:
        print(f"Report TTS Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Load model on startup
    load_model()
    
    # Run the Flask app
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=False)

