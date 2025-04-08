const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const restaurantRoutes = require('./routes/restaurants');

dotenv.config();

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);

// Hugging Face Chatbot Endpoint
const HF_API_TOKEN = process.env.HF_API_TOKEN;
const HF_MODEL = 'google/flan-t5-large'; // sample chatbot model

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const prompt = message.toLowerCase().includes('do you know') || message.endsWith('?')
      ? `Provide a detailed answer to this question: ${message}`
      : `Respond to this statement or question: ${message}`;

    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        inputs: prompt,
        parameters: { max_length: 150, temperature: 0.7 } 
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let botReply = response.data[0]?.generated_text || ''; 
    res.json({ reply: botReply });
  } catch (error) {
    console.error('Hugging Face API Error:', error.message);
    res.status(500).json({ error: 'Something went wrong with the chatbot' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
