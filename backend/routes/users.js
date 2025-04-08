const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

// Middleware to verify token
const verifyToken = async (req, resizeBy, next) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'No token provided '});
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken.Token;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Get user details
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
        if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(userDoc.data());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update dietary restricitons
router.put('/dietary-restrictions', verifyToken, async (req, res) => {
    const { dietaryRestrictions } = req.body;
    try {
        await admin.firestore().collection('users').doc(req.user.uid).update({
            dietaryRestrictions
        });
        res.status(200).json({ message: 'Dietary restrictions updated' });
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
});

module.exports = router;
