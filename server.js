import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// 🔑 THE NEW MASTER KEY (BEARER TOKEN)
// इनाया, अपना नया वाला पूरा टोकन यहाँ पेस्ट करना (मैंने शुरुआत और आख़िर का हिस्सा लिख दिया है):
const PW_AUTH_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3ODM3NzgzOTMuOTIzLCJkYXRhIjp7Il9pZCI6IjY4YTFmMTM3ZjI0MTRjNjhiMzBkM2M4NiIsInVzZXJuYW1lIjoiOTI1MDIzNTU5OSIsImZpcnN0TmFtZSI6IlNhdHlhbSIsIm9yZ2FuaXphdGlvbiI6eyJfaWQiOiI1ZWIzOTNlZTk1ZmFiNzQ2OGE3OWQxODkiLCJ3ZWJzaXRlIjoicGh5c2ljc3dhbGxhaC5jb20iLCJuYW1lIjoiUGh5c2ljc3dhbGxhaCJ9LCJyb2xlcyI6WyI1YjI3YmQ5NjU4NDJmOTUwYTc3OGM2ZWYiXSwiY291bnRyeUdyb3VwIjoiSU4iLCJ0eXBlIjoiVVNFUiJ9LCJqdGkiOiJYWDFjM0N3WlJWeXhlTjhfLU13Z0tRXzY4YTFmMTM3ZjI0MTRjNjhiMzBkM2M4NiIsImlhdCI6MTc4MzE3MzU5M30.NTTPlu0Zoz_QUN9-29hgKcFqkNUecpSgf_TMfp5Qq1s";

// ==========================================
// 🚀 AUTO-SUBJECT FETCH ROUTE
// ==========================================
app.get('/api/get-batch-details', async (req, res) => {
    const batchId = req.query.batchId;

    if (!batchId) {
        return res.status(400).json({ success: false, message: "Batch ID missing!" });
    }

    // 🔥 URL को वापस penpencil.co और v1 पर सेट कर दिया गया है
    const pwUrl = `https://api.penpencil.co/v2/batches/${batchId}/details`;

    try {
        const response = await fetch(pwUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${PW_AUTH_TOKEN}`,
                'Client-Type': 'WEB',
                'Client-Version': '300',
                'Content-Type': 'application/json',
                'Origin': 'https://s3-cdn.samfygros.com',
                'Referer': 'https://s3-cdn.samfygros.com/',
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'en-IN',
                'sec-ch-ua': '"Chromium";v="127", "Not)A;Brand";v="99", "Microsoft Edge Simulate";v="127", "Lemur";v="127"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'Priority': 'u=1, i',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ success: false, message: "Server Blocked or Token Expired" });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Subject Fetch Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


// ==========================================
// 🎬 2. VIDEO PROXY ROUTE
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
        res.status(500).send("Failed to load video manifest");
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 SRT Pro Bypass Server running on http://localhost:${PORT}`);
});