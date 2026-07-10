import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// ==========================================
// 🚀 DYNAMIC BATCH FETCHER (ANTI-CLOUDFLARE PROXY)
// ==========================================
app.get('/api/get-batch-details', async (req, res) => {
    const batchId = req.query.batchId;

    if (!batchId) {
        return res.status(400).json({ success: false, message: "Batch ID missing!" });
    }

    try {
        // 🎯 नया Vidcloud वाला असली API लिंक
        const apiUrl = `https://vidcloud.eu.org/api/v2/batches/${batchId}/details`;

        // 🛡️ सीक्रेट हेडर्स (जो Cloudflare को चकमा देंगे)
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'en-IN',
                
                // 🔥 1. अपना असली Bearer Token यहाँ डालो (527.jpg से)
                'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3ODQxODE0NTcuODksImRhdGEiOnsiX2lkIjoiNjdhN2I5YzI1M2E4OWYyNDUyNTVmYTlhIiwidXNlcm5hbWUiOiI5OTE3Njc2OTcyIiwiZmlyc3ROYW1lIjoiQWtoaWxlc2giLCJvcmdhbml6YXRpb24iOnsiX2lkIjoiNWViMzkzZWU5NWZhYjc0NjhhNzlkMTg5Iiwid2Vic2l0ZSI6InBoeXNpY3N3YWxsYWguY29tIiwibmFtZSI6IlBoeXNpY3N3YWxsYWgifSwicm9sZXMiOlsiNWIyN2JkOTY1ODQyZjk1MGE3NzhjNmVmIl0sImNvdW50cnlHcm91cCI6IklOIiwib25lUm9sZXMiOltdLCJ0eXBlIjoiVVNFUiJ9LCJqdGkiOiJNZGdOZWJHSFRKeTROcWxkdUQtVEtRXzY3YTdiOWMyNTNhODlmMjQ1MjU1ZmE5YSIsImlhdCI6MTc4MzU3NjY1N30.Ye7VZ5UuextMoKXlrSI1pjW-EUDTULNTUZ_MmlbGt1M',
                
                'Cache-Control': 'max-age=0',
                'Client-Id': '5eb393ee95fab7468a79d189',
                'Client-Type': 'WEB',
                'Client-Version': '2.1.6',
                
                // 🔥 2. अपनी असली Cookie यहाँ डालो (528.jpg से)
                'Cookie': 'auth_token=Qd2wfhzRoi5eQdoITwpbNKPMdMTNSs37YUjvj0rSb5sGwlFOxcRHjSW3cSaE0hDa3EYIqKJ8Cbojtx97K589JusZoTjZrZD/9fPKC5my297sQ+KdOKq1y6dcfxLO9RnlSyKE/VgNGmCa8n8vPUdQpf7NEywbapTxiGWWv/+rhxS5CTFFgdMcK/ohRJUIhxKzRAC6W3R8Kql0B0pJ+fW2vImUMisE0SIxeAVngXI7BdDRyXXMP1dUWr9yPOgpCWZ46YZ78CbQE2x6acSuh8C61yS6fKKyr4O/P1m2HRAe5Q6Z8UgyNTkN+CDpp9k974iETh3HBoVodI4l70C5bVmIiNLfP9KpLT0ZK9riU6ta0J5HKxT+DwRwB6Tr0+vs+RPmyWzWxsXSo8nD5+yi84qymWmfpK2Ex+Fz4jdml8cBq0t77YbdC563+D1U0qc7SYbooHOiywMIGFtgtD3RHPH9eUcYKh3nmfSDEKahKzEltQ1HPx5S6/Ffp2ecl1PU6XzuvbA94iFqUPd9fDhy0NT5i5DnRkHzWpxFviqVsX1kIMMVu27xtVRcD3xu2clEDsEvf9cdQy0l+rQueu4TecpfuJLOiYxSutiA+DNLtlADzjAUg7FxeyJeuG//HJMLwUKao76wBC1Nn200d0nm6QDsd2zb70xtQ9w7avi2GCQeLm8lYaNsyjC/ic83cBbgr1NDN/D3kqTamwV8XfPeaxu7p2Vaq7vlYxvcTXG9gP/CVkP+YsEs20NKKztTpU1xMVTHBA4U83atSnUDIb84I6VFLg==; PHPSESSID=26572cdab73de8a3d24cd65e914e351b',
                
                'Priority': 'u=1, i',
                'Randomid': '29c70d16-7c28-415f-a52b-bb44bd266b51',
                'Referer': 'https://vidcloud.eu.org/',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
                'Version': '0.0.1'
            }
        });

        if (!response.ok) {
            throw new Error(`Proxy Blocked! Status: ${response.status}`);
        }

        const data = await response.json();

        // 4. बड़े डेटा में से सिर्फ 'subjects' की लिस्ट निकालकर फ्रंटएंड को दे दो
        const subjectsList = data?.data?.subjects || [];

        res.json({ success: true, data: subjectsList });

    } catch (error) {
        console.error("Dynamic Fetch Error:", error.message);
        res.status(500).json({ success: false, message: "API से डेटा नहीं मिल पाया!" });
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
