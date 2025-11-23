require('dotenv').config();
const cors = require('cors');
const express = require('express');
const fetch = (...args) => import('node-fetch').then(m => m.default(...args));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = (process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite').replace(/^models\//, '');

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not set. Set in environment or .env file.');
}

const app = express();
app.use(express.json());
app.use(express.static(__dirname));
app.use(cors());

app.post('/api/chat', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'API key missing on server' });
    const { convo = [] } = req.body;

    const contents = convo.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(apiRes.status).json({ error: errText });
    }
    const data = await apiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server listening on ' + PORT));
