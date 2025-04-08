const express = require('express');
const admin = require('firebase-admin');
const fetch = require('node-fetch'); 
const router = express.Router();

const GOOGLE_MAPS_API_KEY = 'PLACEHOLDER'; // PLACEHOLDER for security

// Get nearby restaurants
router.get('/nearby', async (req, res) => {
  const { lat, lng } = req.query; 
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=restaurant&key=${PLACEHOLDER}`
    );
    const data = await response.json();
    res.status(200).json(data.results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
