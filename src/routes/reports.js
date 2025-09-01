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
        return {
            diseases: [],
            stage: 'unknown',
            abnormalities: [],
            language: 'en'
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
                generationConfig: { temperature: 0.2 },
                contents: [ { parts } ]
            })
        });
        const json = await response.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return normalizeGeminiOutput(text, lang);
    } catch (e) {
        return { error: 'Gemini request failed', details: e.message };
    }
}

function buildReportPrompt(ocrText, lang) {
    const langInstructions = {
        'en': 'You MUST respond in English with clear, user-friendly language. All text must be in English.',
        'hi': 'You MUST respond in Hindi with clear, user-friendly language. All text must be in Hindi. Translate all medical terms to Hindi. Use Hindi script (देवनागरी) for all responses.',
        'mr': 'You MUST respond in Marathi with clear, user-friendly language. All text must be in Marathi. Translate all medical terms to Marathi. Use Marathi script for all responses.'
    };
    
    const langInstruction = langInstructions[lang] || langInstructions['en'];
    
    return `You are a medical assistant. You will receive lab report image(s) and OCR text. 

CRITICAL LANGUAGE REQUIREMENT: ${langInstruction}

IMPORTANT: First, validate if this is actually a lab report image. Look for:
- Laboratory test results
- Blood test values, urine test results, etc.
- Test parameters with normal ranges
- Numerical values with units (mg/dL, mmol/L, etc.)
- Laboratory name or hospital name
- Test date and patient information

If this is NOT a lab report (e.g., prescription, medical certificate, random image, etc.), return:
{
  "error": "wrong_image_type",
  "message": "This image does not appear to be a lab report. Please upload a lab report image with test results, values, and normal ranges."
}

If this IS a lab report, extract and provide information in a user-friendly manner:
- Likely diseases (array of strings) - explain conditions in simple terms IN ${lang.toUpperCase()}.
- Stage/severity (string; choose from [mild, moderate, severe, critical] based on values and explain what it means IN ${lang.toUpperCase()}).
- Abnormal test values with ranges/flags - explain what each abnormal value indicates IN ${lang.toUpperCase()}.

Rules:
- Respond with STRICT JSON ONLY. No markdown, no code fences.
- ALL TEXT MUST BE IN ${lang.toUpperCase()} LANGUAGE - NO EXCEPTIONS!
- Never return null. Use [] for arrays if unknown; but always output at least one disease guess if reasonable.
- Make all responses user-friendly and easy to understand for patients.
- Schema (translate fields to requested language):
{
  "diseases": [string],
  "stage": string,
  "abnormalities": [{"test": string, "value": string, "range": string, "flag": "high|low|normal|unknown"}],
  "language": "en|hi|mr"
}

Use the image content primarily; OCR_TEXT is a noisy hint.
OCR_TEXT:
${ocrText}`;
}

router.post('/analyze', upload.array('files'), async (req, res) => {
    const lang = (req.body.lang || 'en').toLowerCase();
    const files = req.files || [];
    console.log('Processing report analysis, lang:', lang);
    console.log('Request body:', req.body);
    console.log('Files count:', files.length);
    if (!files.length) return res.status(400).json({ error: 'At least one image required' });

    let combinedText = '';
    const filePaths = files.map(f => f.path);
    try {
        const images = [];
        for (const file of files) {
            const norm = await preprocessImage(file.path, file.mimetype);
            const text = await performOCR(norm.path, lang);
            combinedText += (text + '\n\n');
            const base64 = fs.readFileSync(norm.path).toString('base64');
            images.push({ base64, mimeType: norm.mimeType });
        }
        const prompt = buildReportPrompt(combinedText, lang);
        console.log('Generated report prompt for language:', lang);
        console.log('Prompt preview:', prompt.substring(0, 200) + '...');
        const llm = await callGemini(prompt, images, lang);

        if (mongoose.connection.readyState === 1) {
            try {
                await History.create({
                    type: 'report',
                    ocrText: combinedText,
                    summary: llm,
                    summaryText: llm?.summaryText || '',
                    language: lang
                });
            } catch (e) {
                console.warn('DB save failed (report):', e.message);
            }
        }

        res.json({ ocrText: combinedText, result: llm });
    } catch (e) {
        res.status(500).json({ error: 'Processing failed', details: e.message });
    } finally {
        for (const p of filePaths) {
            if (p && fs.existsSync(p)) fs.unlinkSync(p);
            const normPathCandidate = p.replace(/\.[^.]+$/, '') + '-norm.jpg';
            if (fs.existsSync(normPathCandidate)) {
                try { fs.unlinkSync(normPathCandidate); } catch (_) {}
            }
        }
    }
});

module.exports = router;

// Helpers
function normalizeGeminiOutput(text, lang) {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenceMatch ? fenceMatch[1] : text;
    let parsed;
    try {
        parsed = JSON.parse(candidate);
    } catch (_) {
        const firstBrace = candidate.indexOf('{');
        const lastBrace = candidate.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const slice = candidate.slice(firstBrace, lastBrace + 1);
            try { parsed = JSON.parse(slice); } catch (e2) { parsed = { raw: text }; }
        } else {
            parsed = { raw: text };
        }
    }
    
    // Check for wrong image type error
    if (parsed?.error === 'wrong_image_type') {
        return {
            error: 'wrong_image_type',
            message: parsed.message || 'This image does not appear to be a lab report. Please upload a lab report image with test results, values, and normal ranges.'
        };
    }
    
    const diseases = Array.isArray(parsed?.diseases) ? parsed.diseases : [];
    const stage = typeof parsed?.stage === 'string' ? parsed.stage : 'mild';
    const abnormalities = Array.isArray(parsed?.abnormalities) ? parsed.abnormalities : [];
    const language = typeof parsed?.language === 'string' ? parsed.language : (lang || 'en');
    return {
        diseases: diseases.length ? diseases : ['Unknown'],
        stage,
        abnormalities,
        language
    };
}
