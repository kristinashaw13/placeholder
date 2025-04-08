const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

// Signup route
router.post('/signup', async (req, res) => {
  const { email, password, username } = req.body;
  console.log('Signup request received:', { email, password, username });

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username
    });
    if (!userRecord || !userRecord.uid) {
      throw new Error('Failed to create user: no UID returned');
    }
    const uid = userRecord.uid;
    console.log('User created with UID:', uid);

    await admin.firestore().collection('users').doc(uid).set({
      username,
      email,
      dietaryRestrictions: []
    });
    console.log('Firestore updated for UID:', uid);

    res.status(201).json({ message: 'User created', uid: uid });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { idToken } = req.body;
  console.log('Login request received with token:', idToken);

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Token verified for UID:', decodedToken.uid);
    
    // Return the idToken as 'token' to match frontend expectation
    res.status(200).json({ message: 'Login successful', uid: decodedToken.uid, token: idToken });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  console.log('Logout request received with token:', token);

  try {
    if (!token) {
      throw new Error('No token provided');
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    await admin.auth().revokeRefreshTokens(decodedToken.uid); 
    console.log('Tokens revoked for UID:', decodedToken.uid);
    res.status(200).json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Status route (to check if user is active)
router.get('/status', async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  console.log('Status request received with token:', token);

  try {
    if (!token) {
      throw new Error('No token provided');
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Token verified for UID:', decodedToken.uid);
    res.status(200).json({ active: true });
  } catch (error) {
    console.error('Status error:', error.message);
    res.status(401).json({ active: false, error: error.message });
  }
});

module.exports = router;
