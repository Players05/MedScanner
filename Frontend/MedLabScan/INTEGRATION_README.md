# Frontend-Backend Integration Guide

## Overview
The MedLabScan frontend has been successfully integrated with the backend API to provide real-time medical document analysis capabilities.

## Integration Features

### 1. API Service Layer (`src/services/api.js`)
- **Prescription Analysis**: `analyzePrescription(file, language)`
- **Report Analysis**: `analyzeReport(files, language)`
- **History Retrieval**: `getHistory()`
- **Text-to-Speech**: `textToSpeech(text, language)`
- **Health Check**: `healthCheck()`

### 2. Updated Components

#### PresScan Component
- Integrated with `/api/prescriptions/analyze` endpoint
- Supports multiple languages (English, Hindi, Marathi)
- Real-time file processing and analysis
- Error handling and loading states

#### RepoScan Component
- Integrated with `/api/reports/analyze` endpoint
- Multi-file upload support
- Language-specific analysis
- Comprehensive error handling

#### InfoBox Component
- Displays real prescription analysis results
- Dynamic data rendering based on API response
- Text-to-speech integration
- Fallback to localStorage for data persistence

#### InfoReports Component
- Shows real medical report analysis
- Displays diseases, stage, and abnormalities
- Language-aware content rendering
- TTS functionality for accessibility

#### History Component (New)
- Fetches analysis history from `/api/history`
- Displays previous analyses with timestamps
- Categorized by document type
- Summary previews for quick reference

### 3. Data Flow

```
User Upload → Frontend → Backend API → AI Analysis → Results → Frontend Display
```

1. **File Upload**: User selects image/PDF file
2. **Language Selection**: User chooses preferred language
3. **API Call**: Frontend sends file and language to backend
4. **Processing**: Backend performs OCR and AI analysis
5. **Response**: Results returned to frontend
6. **Display**: Data rendered in user-friendly format
7. **Storage**: Results saved to history and localStorage

### 4. Language Support

- **English (en)**: Default language
- **Hindi (hi)**: हिन्दी support with Devanagari script
- **Marathi (mr)**: मराठी support
- **Dynamic Content**: All analysis results displayed in selected language

### 5. Error Handling

- **Network Errors**: Graceful fallback with user-friendly messages
- **API Errors**: Detailed error messages from backend
- **File Validation**: Frontend file type and size validation
- **Loading States**: Visual feedback during processing

### 6. Data Persistence

- **Navigation State**: Results passed via React Router state
- **localStorage**: Fallback storage for data persistence
- **History API**: Backend storage for long-term data retention

## Configuration

### Environment Variables
Create a `.env` file in the frontend root:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Backend Requirements
- Node.js server running on port 3000
- MongoDB connection (optional, for history)
- Gemini API key for AI analysis
- Tesseract.js for OCR processing

## Usage

### Starting the Application

1. **Backend**: Start the Node.js server
   ```bash
   cd /path/to/MedScanner
   npm start
   ```

2. **Frontend**: Start the React development server
   ```bash
   cd Frontend/MedLabScan
   npm run dev
   ```

3. **Access**: Open `http://localhost:5173` in your browser

### Testing the Integration

1. **Upload Test Image**: Use a prescription or medical report image
2. **Select Language**: Choose English, Hindi, or Marathi
3. **Process Document**: Click the process button
4. **View Results**: Results displayed in InfoBox or InfoReports
5. **Check History**: View analysis history in the History component

## API Endpoints

- `POST /api/prescriptions/analyze` - Prescription analysis
- `POST /api/reports/analyze` - Medical report analysis
- `GET /api/history` - Analysis history
- `POST /api/tts/synthesize` - Text-to-speech
- `GET /health` - Health check

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend has CORS enabled
2. **File Upload Failures**: Check file size and type restrictions
3. **API Connection**: Verify backend server is running
4. **Language Issues**: Ensure proper language codes are sent

### Debug Mode

Enable console logging in the browser to see:
- API request/response details
- Error messages and stack traces
- Data flow between components

## Future Enhancements

- **Real-time Updates**: WebSocket integration for live processing
- **Batch Processing**: Multiple document analysis
- **Export Functionality**: PDF/Excel export of results
- **User Authentication**: Secure user accounts and data
- **Mobile App**: React Native version for mobile devices
