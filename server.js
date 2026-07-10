import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// 🔑 THE MASTER KEY (अपना असली Study Rays वाला Bearer Token यहाँ डालना है)
const AUTH_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3ODQxODE0NTcuODksImRhdGEiOnsiX2lkIjoiNjdhN2I5YzI1M2E4OWYyNDUyNTVmYTlhIiwidXNlcm5hbWUiOiI5OTE3Njc2OTcyIiwiZmlyc3ROYW1lIjoiQWtoaWxlc2giLCJvcmdhbml6YXRpb24iOnsiX2lkIjoiNWViMzkzZWU5NWZhYjc0NjhhNzlkMTg5Iiwid2Vic2l0ZSI6InBoeXNpY3N3YWxsYWguY29tIiwibmFtZSI6IlBoeXNpY3N3YWxsYWgifSwicm9sZXMiOlsiNWIyN2JkOTY1ODQyZjk1MGE3NzhjNmVmIl0sImNvdW50cnlHcm91cCI6IklOIiwib25lUm9sZXMiOltdLCJ0eXBlIjoiVVNFUiJ9LCJqdGkiOiJNZGdOZWJHSFRKeTROcWxkdUQtVEtRXzY3YTdiOWMyNTNhODlmMjQ1MjU1ZmE5YSIsImlhdCI6MTc4MzU3NjY1N30.Ye7VZ5UuextMoKXlrSI1pjW-EUDTULNTUZ_MmlbGt1M";

// ==========================================
// 🚀 1. DYNAMIC BATCH FETCHER (STUDY RAYS PROXY ROUTE)
// ==========================================
app.get('/api/get-batch-details', async (req, res) => {
    const batchId = req.query.batchId;
    
    if (!batchId) {
        return res.status(400).json({ success: false, message: "Batch ID missing!" });
    }

    try {
        // 🎯 Study Rays का अपना API डोमेन (vidcloud.eu.org)
        const apiUrl = `https://vidcloud.eu.org/api/v2/batches/${batchId}/details`; 
        
        // 🛡️
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Client-Id': '5eb393ee95fab7468a79d189',
                'Client-Type': 'WEB',
                'Client-Version': '2.2.7',
                'Origin': 'https://vidcloud.eu.org',
                'Referer': 'https://vidcloud.eu.org/',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'en-IN'
            }
        });

        if (!response.ok) {
            throw new Error(`Proxy Server Connection Failed! Status: ${response.status}`);
        }

        const data = await response.json();

        // 4. बड़े डेटा में से सिर्फ 'subjects' की लिस्ट निकालकर फ्रंटएंड को दे दो
        const subjectsList = data?.data?.subjects || [];
        
        res.json({ success: true, data: subjectsList });
        
    } catch (error) {
        console.error("Dynamic Fetch Error:", error.message);
        res.status(500).json({ success: false, message: "Study Rays API से डेटा नहीं मिल पाया या टोकन एक्सपायर हो गया है!" });
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
    console.log(`🚀 Study Rays API Proxy Server running on port ${PORT}`);
});
