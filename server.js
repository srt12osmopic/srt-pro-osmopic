import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors());

// ==========================================
// 🚀 1. DIRECT JSON LOAD (NO PW API, NO BLOCK!)
// ==========================================
app.get('/api/get-batch-details', (req, res) => {
    try {
        // यह सीधे तुम्हारी फाइल से डेटा उठाएगा!
        // अगर फाइल का नाम कुछ और है तो यहाँ बदल देना (जैसे BatchInfo.json)
        const jsonData = fs.readFileSync('./Batches.json', 'utf-8'); 
        
        const data = JSON.parse(jsonData);
        res.json(data); // सीधा Vercel वेबसाइट को डेटा भेज दो!
    } catch (error) {
        console.error("JSON Read Error:", error);
        res.status(500).json({ success: false, message: "JSON फाइल नहीं मिली!" });
    }
});

// ==========================================
// 🎬 2. VIDEO PROXY (अगर ज़रूरत हो)
// ==========================================
app.get('/proxy', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).send("No URL provided");
    
    try {
        const response = await fetch(videoUrl);
        const text = await response.text();
        res.setHeader('Content-Type', 'application/dash+xml');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(text);
    } catch (error) {
        res.status(500).send("Failed to load video");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
});
