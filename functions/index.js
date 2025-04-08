const functions = require('firebase-functions');
const axios = require('axios');

const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill'; // sample chatbot for testing
const HUGGING_FACE_API_TOKEN = process.env.PLACEHOLDER;

exports.askChatbot = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { question } = req.body;
  if (!question) {
    return res.status(400).send('Question is required');
  }

  try {
    const response = await axios.post(
      HUGGING_FACE_API_URL,
      {
        inputs: question,
        parameters: { max_length: 150, min_length: 10 },
      },
      {
        headers: {
          Authorization: `Bearer ${PLACEHOLDER}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const answer = response.data.generated_text || 'Sorry, I couldn’t generate a response.';
    res.status(200).json({ answer });
  } catch (error) {
    console.error('Hugging Face API error:', error.message, error.response?.data);
    res.status(500).send('Error processing your request');
  }
});
