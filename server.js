import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// 🛡️ HEADERS - (सारे सीक्रेट हेडर्स एक ही जगह)
const getHeaders = () => ({
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-IN',
    
    // 🔥 1. आज का एकदम ताज़ा Bearer Token यहाँ डालो
    'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3ODQxODE0NTcuODksImRhdGEiOnsiX2lkIjoiNjdhN2I5YzI1M2E4OWYyNDUyNTVmYTlhIiwidXNlcm5hbWUiOiI5OTE3Njc2OTcyIiwiZmlyc3ROYW1lIjoiQWtoaWxlc2giLCJvcmdhbml6YXRpb24iOnsiX2lkIjoiNWViMzkzZWU5NWZhYjc0NjhhNzlkMTg5Iiwid2Vic2l0ZSI6InBoeXNpY3N3YWxsYWguY29tIiwibmFtZSI6IlBoeXNpY3N3YWxsYWgifSwicm9sZXMiOlsiNWIyN2JkOTY1ODQyZjk1MGE3NzhjNmVmIl0sImNvdW50cnlHcm91cCI6IklOIiwib25lUm9sZXMiOltdLCJ0eXBlIjoiVVNFUiJ9LCJqdGkiOiJNZGdOZWJHSFRKeTROcWxkdUQtVEtRXzY3YTdiOWMyNTNhODlmMjQ1MjU1ZmE5YSIsImlhdCI6MTc4MzU3NjY1N30.Ye7VZ5UuextMoKXlrSI1pjW-EUDTULNTUZ_MmlbGt1M',
    
    'Cache-Control': 'max-age=0',
    'Client-Id': '5eb393ee95fab7468a79d189',
    'Client-Type': 'WEB',
    'Client-Version': '2.1.6',
    
    // 🔥 2. आज की एकदम ताज़ा Cookie यहाँ डालो
    'Cookie': 'auth_token=Qd2wfhzRoi5eQdoITwpbNKPMdMTNSs37YUjvj0rSb5sGwlFOxcRHjSW3cSaE0hDa3EYIqKJ8Cbojtx97K589JusZoTjZrZD/9fPKC5my297sQ+KdOKq1y6dcfxLO9RnlSyKE/VgNGmCa8n8vPUdQpf7NEywbapTxiGWWv/+rhxS5CTFFgdMcK/ohRJUIhxKzRAC6W3R8Kql0B0pJ+fW2vImUMisE0SIxeAVngXI7BdDRyXXMP1dUWr9yPOgpCWZ46YZ78CbQE2x6acSuh8C61yS6fKKyr4O/P1m2HRAe5Q6Z8UgyNTkN+CDpp9k974iETh3HBoVodI4l70C5bVmIiNLfP9KpLT0ZK9riU6ta0J5HKxT+DwRwB6Tr0+vs+RPmyWzWxsXSo8nD5+yi84qymWmfpK2Ex+Fz4jdml8cBq0t77YbdC563+D1U0qc7SYbooHOiywMIGFtgtD3RHPH9eUcYKh3nmfSDEKahKzEltQ1HPx5S6/Ffp2ecl1PU6XzuvbA94iFqUPd9fDhy0NT5i5DnRkHzWpxFviqVsX1kIMMVu27xtVRcD3xu2clEDsEvf9cdQy0l+rQueu4TecpfuJLOiYxSutiA+DNLtlADzjAUg7FxeyJeuG//HJMLwUKao76wBC1Nn200d0nm6QDsd2zb70xtQ9w7avi2GCQeLm8lYaNsyjC/ic83cBbgr1NDN/D3kqTamwV8XfPeaxu7p2Vaq7vlYxvcTXG9gP/CVkP+YsEs20NKKztTpU1xMVTHBA4U83atSnUDIb84I6VFLg==; PHPSESSID=26572cdab73de8a3d24cd65e914e351b',
    
    'Priority': 'u=1, i',
    'Randomid': '29c70d16-7c28-415f-a52b-bb44bd266b51',
    'Referer': 'https://vidcloud.eu.org/',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    'Version': '0.0.1'
});

// ==========================================
// 🚀 THE "UNIVERSAL" API PROXY (अब कोई भी URL चलेगा)
// ==========================================
app.get('/api/proxy', async (req, res) => {
    // 1. फ्रंटएंड से पूरा टारगेट URL मंगाओ
    const targetUrl = req.query.url; 

    if (!targetUrl) {
        return res.status(400).json({ success: false, message: "URL is missing in the request!" });
    }

    try {
        console.log(`📡 Fetching Data from: ${targetUrl}`);
        
        // 2. Headres के साथ रिक्वेस्ट भेजो
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cloudflare Blocked or Token Expired! Status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // 3. जो भी डेटा मिला, उसे सीधा भेज दो
        res.json({ success: true, data: data });

    } catch (error) {
        console.error("❌ Fetch Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Universal Anti-Bot Server running on port ${PORT}`);
});
