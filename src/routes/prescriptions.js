const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const History = require('../models/History');
let sharp;
try { sharp = require('sharp'); } catch (_) { sharp = null; }

const router = express.Router();

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path.join(process.cwd(), 'tmp_uploads');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${unique}${path.extname(file.originalname)}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png'];
        if (!allowed.includes(file.mimetype)) return cb(new Error('Only JPG/PNG allowed'));
        cb(null, true);
    }
});

async function performOCR(imagePath, lang) {
    const langMap = { en: 'eng', hi: 'hin', mr: 'mar' };
    const tesseractLang = langMap[lang] || 'eng';
    const { data } = await Tesseract.recognize(imagePath, tesseractLang);
    return data.text || '';
}

async function preprocessImage(inputPath, mimetype) {
    if (!sharp) return { path: inputPath, mimeType: mimetype };
    const outPath = inputPath.replace(/\.[^.]+$/, '') + '-norm.jpg';
    try {
        await sharp(inputPath)
            .flatten({ background: '#ffffff' })
            .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toFile(outPath);
        return { path: outPath, mimeType: 'image/jpeg' };
    } catch (e) {
        return { path: inputPath, mimeType: mimetype };
    }
}

async function callGemini(prompt, images, lang) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        const notAvailableMessages = {
            'en': ['Generic medicine not available'],
            'hi': ['जेनेरिक दवा उपलब्ध नहीं है'],
            'mr': ['जेनेरिक औषध उपलब्ध नाही']
        };
        
        return {
            medicines: [],
            indication: 'unknown',
            generics: notAvailableMessages[lang] || notAvailableMessages['en'],
            stage: 'unknown',
            language: lang || 'en'
        };
    }
    try {
        const parts = [ { text: prompt } ];
        if (Array.isArray(images)) {
            for (const img of images) {
                if (img && img.base64 && img.mimeType) {
                    parts.push({ inline_data: { mime_type: img.mimeType, data: img.base64 } });
                }
            }
        }
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                generationConfig: { 
                    temperature: 0.1,
                    topP: 0.9,
                    topK: 40
                },
                contents: [ { parts } ]
            })
        });
        const json = await response.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('Gemini raw response:', text.substring(0, 500) + '...');
        return normalizeGeminiOutput(text, lang);
    } catch (e) {
        return { error: 'Gemini request failed', details: e.message };
    }
}

function buildPrescriptionPrompt(ocrText, lang) {
    const langInstructions = {
        'en': 'You MUST respond in English with clear, user-friendly language. All text must be in English.',
        'hi': 'You MUST respond in Hindi with clear, user-friendly language. All text must be in Hindi. Translate all medical terms to Hindi. Use Hindi script (देवनागरी) for all responses.',
        'mr': 'You MUST respond in Marathi with clear, user-friendly language. All text must be in Marathi. Translate all medical terms to Marathi. Use Marathi script for all responses.'
    };
    
    const langInstruction = langInstructions[lang] || langInstructions['en'];
    
    const genericInstructions = {
        'en': 'For generic alternatives, provide the generic names of the medicines. Only return ["Generic medicine not available"] if the medicine is a very specific brand-name drug with no known generic equivalent (like some biologics, orphan drugs, or very new medications). For common medicines like paracetamol, amoxicillin, etc., always provide the generic name.',
        'hi': 'For generic alternatives, provide the generic names of the medicines in Hindi. Only return ["जेनेरिक दवा उपलब्ध नहीं है"] if the medicine is a very specific brand-name drug with no known generic equivalent. For common medicines, always provide the generic name.',
        'mr': 'For generic alternatives, provide the generic names of the medicines in Marathi. Only return ["जेनेरिक औषध उपलब्ध नाही"] if the medicine is a very specific brand-name drug with no known generic equivalent. For common medicines, always provide the generic name.'
    };
    
    const genericInstruction = genericInstructions[lang] || genericInstructions['en'];
    
    return `You are a medical assistant. You will receive prescription image(s) and OCR text. 

🚨 CRITICAL LANGUAGE REQUIREMENT: ${langInstruction}
🚨 YOU MUST RESPOND ENTIRELY IN ${lang.toUpperCase()} LANGUAGE - NO EXCEPTIONS!

IMPORTANT: First, validate if this is actually a prescription image. Look for:
- Doctor's prescription pad/letterhead
- Medicine names with dosages and instructions
- Doctor's signature
- Patient information
- Rx symbol or prescription format

If this is NOT a prescription (e.g., lab report, medical certificate, random image, etc.), return:
{
  "error": "wrong_image_type",
  "message": "This image does not appear to be a prescription. Please upload a prescription image with medicine names, dosages, and doctor's signature."
}

If this IS a prescription, extract and provide information in a user-friendly manner:
- Medicine names (array of objects with "brand" and "generic" fields).
- Indication/diagnosis (string) - explain the condition in simple terms IN ${lang.toUpperCase()}.
- Generic alternatives (array of strings) - ${genericInstruction}
- Estimated stage/severity (string; choose from [mild, moderate, severe, critical] based on medicines and dosage; never "unknown").

🚨 LANGUAGE ENFORCEMENT RULES:
- ALL TEXT CONTENT MUST BE IN ${lang.toUpperCase()} LANGUAGE - NO EXCEPTIONS!
- ALL MEDICINE NAMES MUST BE IN ${lang.toUpperCase()} LANGUAGE
- ALL INDICATIONS MUST BE IN ${lang.toUpperCase()} LANGUAGE  
- ALL GENERIC NAMES MUST BE IN ${lang.toUpperCase()} LANGUAGE
- ALL STAGE/SEVERITY MUST BE IN ${lang.toUpperCase()} LANGUAGE
- BUT USE ENGLISH FIELD NAMES: "medicines", "indication", "generics", "stage"

General Rules:
- Respond with STRICT JSON ONLY. No markdown, no code fences.
- If medicine has both brand and generic names, include both.
- If only generic name is available, put it in "generic" field.
- If only brand name is available, put it in "brand" field.
- For indication, extract the main diagnosis and explain it in simple, understandable terms IN ${lang.toUpperCase()}.
- For generics, provide the generic names of the medicines IN ${lang.toUpperCase()}. Most medicines have generic equivalents. Only use "not available" for very specific brand-name drugs with no known generic equivalent (like some biologics, orphan drugs, or very new medications).
- Common medicines like paracetamol, amoxicillin, ibuprofen, omeprazole, cetirizine, etc. always have generic equivalents.
- Examples: Crocin → Paracetamol, Augmentin → Amoxicillin + Clavulanic acid, Brufen → Ibuprofen, Pantop → Pantoprazole
- For stage, analyze dosage, frequency, and medicine types to estimate severity and explain what it means IN ${lang.toUpperCase()}.
- Make all responses user-friendly and easy to understand for patients.
- NEVER leave generic alternatives empty or return "-". Always provide either generic names or the "not available" message.

🚨 FINAL REMINDER: EVERY SINGLE WORD IN YOUR RESPONSE MUST BE IN ${lang.toUpperCase()} LANGUAGE!
🚨 USE ENGLISH FIELD NAMES: "medicines", "indication", "generics", "stage"
🚨 BUT PUT HINDI/MARATHI TEXT INSIDE THOSE FIELDS!

OCR Text: ${ocrText}

JSON Response:`;
}

function normalizeGeminiOutput(text, lang) {
    console.log('Normalizing Gemini output for language:', lang);
    console.log('Raw text to parse:', text.substring(0, 300) + '...');
    
    try {
        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            console.log('Found JSON match, length:', jsonMatch[0].length);
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('Parsed JSON:', JSON.stringify(parsed, null, 2));
            
            // Check for wrong image type error
            if (parsed.error === 'wrong_image_type') {
                return {
                    error: 'wrong_image_type',
                    message: parsed.message || 'This image does not appear to be a prescription. Please upload a prescription image with medicine names, dosages, and doctor\'s signature.'
                };
            }
            
            // Handle different field names for different languages
            let medicines = [];
            let indication = 'unknown';
            let stage = 'unknown';
            let generics = [];
            
            // Check for English field names
            if (parsed.medicines) {
                medicines = Array.isArray(parsed.medicines) ? parsed.medicines : [];
            }
            if (parsed.indication) {
                indication = parsed.indication;
            }
            if (parsed.stage || parsed.estimated_stage_severity) {
                stage = parsed.stage || parsed.estimated_stage_severity;
            }
            if (parsed.generics || parsed.generic_alternatives) {
                generics = Array.isArray(parsed.generics || parsed.generic_alternatives) ? (parsed.generics || parsed.generic_alternatives) : [];
            }
            
            // Check for Hindi field names
            if (parsed['दवाइयाँ'] || parsed['औषधे']) {
                medicines = Array.isArray(parsed['दवाइयाँ'] || parsed['औषधे']) ? (parsed['दवाइयाँ'] || parsed['औषधे']) : [];
            }
            if (parsed['निदान']) {
                indication = parsed['निदान'];
            }
            if (parsed['अवस्था/गंभीरता'] || parsed['अंदाजित टप्पा/गंभीरता']) {
                stage = parsed['अवस्था/गंभीरता'] || parsed['अंदाजित टप्पा/गंभीरता'];
            }
            if (parsed['जेनेरिक विकल्प']) {
                generics = Array.isArray(parsed['जेनेरिक विकल्प']) ? parsed['जेनेरिक विकल्प'] : [];
            }
            
            // Check for Marathi field names
            if (parsed['औषधे']) {
                medicines = Array.isArray(parsed['औषधे']) ? parsed['औषधे'] : [];
            }
            if (parsed['निदान']) {
                indication = parsed['निदान'];
            }
            if (parsed['अंदाजित टप्पा/गंभीरता']) {
                stage = parsed['अंदाजित टप्पा/गंभीरता'];
            }
            if (parsed['जेनेरिक पर्याय']) {
                generics = Array.isArray(parsed['जेनेरिक पर्याय']) ? parsed['जेनेरिक पर्याय'] : [];
            }
            
            console.log('Extracted medicines:', medicines);
            console.log('Extracted indication:', indication);
            console.log('Extracted generics:', generics);
            console.log('Extracted stage:', stage);
            
            // Only replace with "not available" if generics is truly empty or contains only invalid values
            if (generics.length === 0 || (generics.length === 1 && (generics[0] === '-' || generics[0] === 'unknown' || generics[0] === '' || generics[0] === 'null'))) {
                const notAvailableMessages = {
                    'en': ['Generic medicine not available'],
                    'hi': ['जेनेरिक दवा उपलब्ध नहीं है'],
                    'mr': ['जेनेरिक औषध उपलब्ध नाही']
                };
                generics = notAvailableMessages[lang] || notAvailableMessages['en'];
                console.log('Replaced generics with:', generics);
            }
            
            // Only replace with "not available" if generics is truly empty or contains only invalid values
            if (generics.length === 0 || (generics.length === 1 && (generics[0] === '-' || generics[0] === 'unknown' || generics[0] === '' || generics[0] === 'null'))) {
                const notAvailableMessages = {
                    'en': ['Generic medicine not available'],
                    'hi': ['जेनेरिक दवा उपलब्ध नहीं है'],
                    'mr': ['जेनेरिक औषध उपलब्ध नाही']
                };
                generics = notAvailableMessages[lang] || notAvailableMessages['en'];
                console.log('Replaced generics with:', generics);
            }
            
            const result = {
                medicines: medicines,
                indication: indication,
                generics: generics,
                stage: stage,
                language: lang || 'en'
            };
            
            console.log('Final normalized result:', JSON.stringify(result, null, 2));
            return result;
        } else {
            console.log('No JSON match found in text');
        }
    } catch (e) {
        console.error('Failed to parse Gemini output:', e);
    }
    
    // Fallback response with language-specific text
    const fallbackMessages = {
        'en': {
            medicines: [],
            indication: 'Unable to determine condition',
            generics: ['Generic medicine not available'],
            stage: 'Unable to determine severity'
        },
        'hi': {
            medicines: [],
            indication: 'रोग निर्धारित नहीं कर सकते',
            generics: ['जेनेरिक दवा उपलब्ध नहीं है'],
            stage: 'गंभीरता निर्धारित नहीं कर सकते'
        },
        'mr': {
            medicines: [],
            indication: 'रोग ठरवू शकत नाही',
            generics: ['जेनेरिक औषध उपलब्ध नाही'],
            stage: 'गंभीरता ठरवू शकत नाही'
        }
    };
    
    const fallback = fallbackMessages[lang] || fallbackMessages['en'];
    console.log('Using fallback response for language:', lang, fallback);
    
    return {
        ...fallback,
        language: lang || 'en'
    };
}

router.post('/analyze', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const lang = req.body.lang || 'en';
        console.log(`Processing prescription: ${req.file.originalname}, lang: ${lang}`);
        console.log('Request body:', req.body);
        console.log('Language selected:', lang);

        // Preprocess image
        const processed = await preprocessImage(req.file.path, req.file.mimetype);
        
        // Perform OCR
        const ocrText = await performOCR(processed.path, lang);
        console.log('OCR Text:', ocrText.substring(0, 200) + '...');

        // Prepare image for Gemini
        const imageBuffer = fs.readFileSync(processed.path);
        const base64Image = imageBuffer.toString('base64');
        const images = [{
            base64: base64Image,
            mimeType: processed.mimeType
        }];

        // Call Gemini API
        const prompt = buildPrescriptionPrompt(ocrText, lang);
        console.log('Generated prompt for language:', lang);
        console.log('Prompt preview:', prompt.substring(0, 200) + '...');
        const geminiResult = await callGemini(prompt, images, lang);

        if (geminiResult.error) {
            return res.status(500).json({ error: geminiResult.error, details: geminiResult.details });
        }

        // Save to history
        if (mongoose.connection.readyState === 1) {
            try {
                const history = new History({
                    type: 'prescription',
                    summary: geminiResult,
                    ocrText: ocrText.substring(0, 1000), // Limit OCR text length
                    filename: req.file.originalname
                });
                await history.save();
            } catch (e) {
                console.error('Failed to save to history:', e);
            }
        }

        // Clean up
        try {
            fs.unlinkSync(req.file.path);
            if (processed.path !== req.file.path) {
                fs.unlinkSync(processed.path);
            }
        } catch (e) {
            console.error('Failed to clean up files:', e);
        }

        res.json({ result: geminiResult });

    } catch (error) {
        console.error('Prescription analysis error:', error);
        res.status(500).json({ error: 'Analysis failed', details: error.message });
    }
});

module.exports = router;
