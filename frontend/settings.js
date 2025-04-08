console.log('settings.js loaded');

// Firebase configuration (PLACEHOLDER for security)
const firebaseConfig = {
  apiKey: "PLACEHOLDER",
  authDomain: "PLACEHOLDER",
  projectId: "PLACEHOLDER",
  storageBucket: "PLACEHOLDER",
  messagingSenderId: "PLACEHOLDER",
  appId: "PLACEHOLDER"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM elements
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  const loadingMessage = document.getElementById('loading-message');
  const settingsContainer = document.getElementById('settings-container');
  const profileForm = document.getElementById('profile-form');
  const usernameInput = document.getElementById('username');
  const notificationsCheckbox = document.getElementById('enableNotifications');
  const locationCheckbox = document.getElementById('locationEnabled');
  const emailVerifiedCheckbox = document.getElementById('emailVerified');
  const statusCheckbox = document.getElementById('status');
  const dietaryPreferencesList = document.getElementById('dietaryPreferencesList');
  const dietaryPreferenceSelect = document.getElementById('dietary-preference-select');
  const addDietaryPreferenceBtn = document.getElementById('add-dietary-preference');
  const passwordForm = document.getElementById('password-form');
  const newPasswordInput = document.getElementById('new-password');
  const deleteAccountBtn = document.getElementById('delete-account');
  const saveSettingsBtn = document.getElementById('save-settings');
  const settingsInfoDisplay = document.getElementById('settingsInfoDisplay');
  const sendVerificationEmailBtn = document.getElementById('send-verification-email');

  // Verify critical DOM elements
  if (!loadingMessage || !settingsContainer || !settingsInfoDisplay) {
    console.error('Critical DOM elements missing:', {
      loadingMessage: !!loadingMessage,
      settingsContainer: !!settingsContainer,
      settingsInfoDisplay: !!settingsInfoDisplay
    });
    return;
  }

  // Tab functionality
  window.openTab = function(tabName) {
    console.log('Opening tab:', tabName);
    document.querySelectorAll('.content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    const tabContent = document.getElementById(tabName);
    if (tabContent) tabContent.style.display = 'block';
    const tabButton = document.querySelector(`.tab[onclick="openTab('${tabName}')"]`);
    if (tabButton) tabButton.classList.add('active');
  };
  openTab('profileTab');

  // Check auth state and load settings
  auth.onAuthStateChanged(async (user) => {
    console.log('Auth state changed:', user ? user.uid : 'null');
    if (user) {
      console.log('User logged in:', user.uid);
      try {
        console.log('Fetching user data from Firestore');
        const userDocRef = db.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();
        console.log('Firestore fetch completed, exists:', userDoc.exists);
        let userData = userDoc.exists ? userDoc.data() : { dietaryRestrictions: [] };
        if (!userDoc.exists) {
          console.log('No user data found, initializing defaults');
          userData = {
            username: user.email.split('@')[0],
            notifications: false,
            locationEnabled: false,
            status: true,
            dietaryRestrictions: []
          };
          await userDocRef.set(userData);
          console.log('Default user data set');
        }

        console.log('User data loaded:', userData);
        if (usernameInput) usernameInput.value = userData.username || user.email.split('@')[0];
        if (notificationsCheckbox) notificationsCheckbox.checked = userData.notifications || false;
        if (locationCheckbox) locationCheckbox.checked = userData.locationEnabled || false;
        if (emailVerifiedCheckbox) emailVerifiedCheckbox.checked = user.emailVerified;
        if (statusCheckbox) statusCheckbox.checked = userData.status || false;
        updateDietaryPreferencesList(userData.dietaryRestrictions || []);
        updateSettingsDisplay(userData, user.emailVerified);

        console.log('Hiding loading message, showing settings');
        loadingMessage.style.display = 'none';
        settingsContainer.style.display = 'block';
      } catch (error) {
        console.error('Error loading settings:', error.message, error.code, error.stack);
        loadingMessage.textContent = 'Error loading settings: ' + error.message;
      }
    } else {
      console.log('No user logged in, redirecting');
      loadingMessage.textContent = 'Please log in to view settings';
      setTimeout(() => window.location.href = 'index.html', 2000);
    }
  });

  // Event listeners
  if (profileForm) {
    profileForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const user = auth.currentUser;
      if (!user) return;
      const newUsername = usernameInput.value.trim();
      if (!newUsername) {
        alert('Please enter a username.');
        return;
      }
      try {
        await db.collection('users').doc(user.uid).update({ username: newUsername });
        alert('Username updated!');
        updateSettingsDisplay(await getUserData(user), user.emailVerified);
      } catch (error) {
        console.error('Error updating username:', error.message);
        alert('Error: ' + error.message);
      }
    });
  }

  if (sendVerificationEmailBtn) {
    sendVerificationEmailBtn.addEventListener('click', async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        await user.sendEmailVerification();
        alert('Verification email sent! Check your inbox.');
      } catch (error) {
        console.error('Error sending verification email:', error.message);
        alert('Error: ' + error.message);
      }
    });
  }

  if (addDietaryPreferenceBtn) {
    addDietaryPreferenceBtn.addEventListener('click', async () => {
      const user = auth.currentUser;
      if (!user) return;
      const newPreference = dietaryPreferenceSelect.value;
      if (!newPreference) {
        alert('Please select a dietary preference.');
        return;
      }
      try {
        const userDocRef = db.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();
        const currentRestrictions = userDoc.data().dietaryRestrictions || [];
        if (!currentRestrictions.includes(newPreference)) {
          const updatedRestrictions = [...currentRestrictions, newPreference];
          await userDocRef.update({ dietaryRestrictions: updatedRestrictions });
          updateDietaryPreferencesList(updatedRestrictions);
          updateSettingsDisplay(await getUserData(user), user.emailVerified);
          dietaryPreferenceSelect.value = '';
        } else {
          alert('This preference is already added.');
        }
      } catch (error) {
        console.error('Error adding dietary preference:', error.message);
        alert('Error: ' + error.message);
      }
    });
  }

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async () => {
      const user = auth.currentUser;
      if (!user) return;
      const settings = {
        notifications: notificationsCheckbox.checked,
        locationEnabled: locationCheckbox.checked,
        status: statusCheckbox.checked
      };
      try {
        await db.collection('users').doc(user.uid).update(settings);
        alert('Settings saved!');
        updateSettingsDisplay(await getUserData(user), user.emailVerified);
      } catch (error) {
        console.error('Error saving settings:', error.message);
        alert('Error: ' + error.message);
      }
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const user = auth.currentUser;
      if (!user) return;
      const newPassword = newPasswordInput.value;
      if (newPassword.length < 6) {
        alert('Password must be at least 6 characters.');
        return;
      }
      try {
        await user.updatePassword(newPassword);
        newPasswordInput.value = '';
        alert('Password changed successfully!');
      } catch (error) {
        console.error('Error changing password:', error.message);
        if (error.code === 'auth/requires-recent-login') {
          alert('Please log out and log back in to change your password.');
        } else {
          alert('Error: ' + error.message);
        }
      }
    });
  }

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async () => {
      const user = auth.currentUser;
      if (!user) return;
      if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
      try {
        await db.collection('users').doc(user.uid).delete();
        await user.delete();
        alert('Account deleted. Redirecting to login.');
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Error deleting account:', error.message);
        if (error.code === 'auth/requires-recent-login') {
          alert('Please log out and log back in to delete your account.');
        } else {
          alert('Error: ' + error.message);
        }
      }
    });
  }

  // Helper functions
  async function getUserData(user) {
    const userDoc = await db.collection('users').doc(user.uid).get();
    return userDoc.exists ? userDoc.data() : {};
  }

  function updateDietaryPreferencesList(restrictions) {
    dietaryPreferencesList.innerHTML = restrictions.length
      ? restrictions.map(r => `<p>${r} <button onclick="removeDietaryPreference('${r}')">Remove</button></p>`).join('')
      : '<p>No dietary preferences set.</p>';
  }

  window.removeDietaryPreference = async (preference) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const userDocRef = db.collection('users').doc(user.uid);
      const userDoc = await userDocRef.get();
      const currentRestrictions = userDoc.data().dietaryRestrictions || [];
      const updatedRestrictions = currentRestrictions.filter(r => r !== preference);
      await userDocRef.update({ dietaryRestrictions: updatedRestrictions });
      updateDietaryPreferencesList(updatedRestrictions);
      updateSettingsDisplay(await getUserData(user), user.emailVerified);
    } catch (error) {
      console.error('Error removing dietary preference:', error.message);
      alert('Error: ' + error.message);
    }
  };

  function updateSettingsDisplay(data, emailVerified) {
    settingsInfoDisplay.innerHTML = `
      Username: ${data.username || 'N/A'}<br>
      Notifications: ${data.notifications ? 'Enabled' : 'Disabled'}<br>
      Location Sharing: ${data.locationEnabled ? 'Enabled' : 'Disabled'}<br>
      Email Verified: ${emailVerified ? 'Yes' : 'No'}<br>
      Status: ${data.status ? 'Active' : 'Inactive'}<br>
      Dietary Preferences: ${data.dietaryRestrictions?.join(', ') || 'None'}
    `;
  }

  const dropdownBtn = document.querySelector('.dropbtn');
  if (dropdownBtn) {
    dropdownBtn.addEventListener('click', () => {
      document.querySelector('.dropdown-content').classList.toggle('active');
    });
  } else {
    console.warn('Dropdown button not found');
  }
});
