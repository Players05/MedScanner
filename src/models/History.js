const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema(
    {
        type: { type: String, enum: ['prescription', 'report'], required: true },
        userName: { type: String },
        userEmail: { type: String },
        ocrText: { type: String, required: true },
        summary: { type: Object, required: true },
        summaryText: { type: String },
        language: { type: String, enum: ['en', 'hi', 'mr'], default: 'en' }
    },
    { timestamps: true }
);

module.exports = mongoose.models.History || mongoose.model('History', HistorySchema);


