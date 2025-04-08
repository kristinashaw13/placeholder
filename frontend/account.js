console.log('accounts.js loaded');

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
const storage = firebase.storage();

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');

  // DOM elements
  const profilePicture = document.getElementById('profile-picture');
  const profilePictureUpload = document.getElementById('profile-picture-upload');
  const uploadPictureBtn = document.getElementById('upload-picture-btn');
  const changePictureBtn = document.getElementById('change-picture-btn');
  const removePictureBtn = document.getElementById('remove-picture-btn');
  const loadingMessage = document.getElementById('loading-message');
  const userDetails = document.getElementById('user-details');
  const logoutButton = document.getElementById('logout-button');

  // Verify DOM elements
  console.log('DOM elements:', {
    profilePicture: !!profilePicture,
    profilePictureUpload: !!profilePictureUpload,
    uploadPictureBtn: !!uploadPictureBtn,
    changePictureBtn: !!changePictureBtn,
    removePictureBtn: !!removePictureBtn,
    loadingMessage: !!loadingMessage,
    userDetails: !!userDetails,
    logoutButton: !!logoutButton
  });

  // Function to update dietary restrictions display and attach event listeners
  function updateDietaryDisplay(restrictions, user) {
    console.log('Updating dietary display with:', restrictions);
    const dietaryList = document.getElementById('dietary-display-list');
    const userDietary = document.getElementById('user-dietary');
    dietaryList.innerHTML = '';

    if (restrictions && restrictions.length > 0) {
      restrictions.forEach((restriction) => {
        const li = document.createElement('li');
        li.textContent = restriction;
        const removeLink = document.createElement('a');
        removeLink.href = '#';
        removeLink.textContent = ' [Remove]';
        removeLink.className = 'remove-restriction';
        removeLink.dataset.restriction = restriction;
        li.appendChild(removeLink);
        dietaryList.appendChild(li);
      });
      userDietary.textContent = restrictions.join(', ');
    } else {
      dietaryList.innerHTML = '<li>No restrictions to display</li>';
      userDietary.textContent = 'No restrictions to display';
    }

    document.querySelectorAll('.remove-restriction').forEach(link => {
      link.removeEventListener('click', handleRemoveClick);
      link.addEventListener('click', handleRemoveClick);
      function handleRemoveClick(e) {
        console.log('Remove link clicked for:', link.dataset.restriction);
        removeRestriction(e, user);
      }
    });
  }

  // Function to update profile picture
  function updateProfilePictureUI(url) {
    const defaultImage = 'images/default-profile.jpg'; // Ensure this path exists
    const imageUrl = url || defaultImage;
    console.log('Updating profile picture UI with URL:', imageUrl);
    if (profilePicture) {
      profilePicture.src = imageUrl;
      profilePicture.onerror = () => {
        console.error('Failed to load image:', imageUrl);
        profilePicture.src = defaultImage; // Fallback
      };
    } else {
      console.error('Profile picture element not found');
    }
    if (url) {
      uploadPictureBtn.style.display = 'none';
      changePictureBtn.style.display = 'inline-block';
      removePictureBtn.style.display = 'inline-block';
    } else {
      uploadPictureBtn.style.display = 'inline-block';
      changePictureBtn.style.display = 'none';
      removePictureBtn.style.display = 'none';
    }
  }

  // Check auth state and fetch user data
  auth.onAuthStateChanged(async (user) => {
    console.log('Auth state changed:', user ? user.uid : 'No user');
    if (!loadingMessage || !userDetails || !logoutButton) {
      console.error('Critical DOM elements missing');
      return;
    }

    if (user) {
      console.log('User logged in:', user.uid);
      try {
        console.log('Fetching Firestore document for UID:', user.uid);
        const userDocRef = db.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();
        console.log('Firestore fetch completed, exists:', userDoc.exists);

        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log('User data:', userData);

          document.getElementById('user-email').textContent = user.email;
          document.getElementById('user-username').textContent = userData.username;
          document.getElementById('user-last-login').textContent = user.metadata.lastSignInTime;
          updateDietaryDisplay(userData.dietaryRestrictions || [], user);
          updateProfilePictureUI(userData.profilePictureUrl);

          loadingMessage.style.display = 'none';
          userDetails.style.display = 'block';
          logoutButton.style.display = 'block';
        } else {
          console.log('No Firestore data, using default');
          updateProfilePictureUI(null);
          loadingMessage.textContent = 'Error: User data not found';
          userDetails.style.display = 'none';
          logoutButton.style.display = 'block';
        }
      } catch (error) {
        console.error('Error fetching user data:', error.message, error.code, error.stack);
        loadingMessage.textContent = 'Error loading account info: ' + error.message;
      }
    } else {
      console.log('No user logged in');
      loadingMessage.textContent = 'Please log in to view your account';
      window.location.href = 'index.html';
    }
  });

  // Upload profile picture
  if (uploadPictureBtn) {
    uploadPictureBtn.addEventListener('click', async () => {
      console.log('Upload picture button clicked');
      const user = auth.currentUser;
      if (!user) {
        console.log('No user authenticated');
        alert('You must be logged in to upload a profile picture.');
        return;
      }

      const file = profilePictureUpload.files[0];
      console.log('File to upload:', file ? file.name : 'None');
      if (!file) {
        console.log('No file selected');
        alert('Please select an image to upload.');
        return;
      }

      try {
        console.log('Refreshing auth token for user:', user.uid);
        const token = await user.getIdToken(true);
        console.log('Auth token refreshed:', token.substring(0, 10) + '...');

        console.log('Uploading profile picture for user:', user.uid, 'File:', file.name);
        const storageRef = storage.ref(`profile-pictures/${user.uid}/${file.name}`);
        const uploadTask = await storageRef.put(file);
        console.log('Upload task completed:', uploadTask.state);
        const profilePictureUrl = await storageRef.getDownloadURL();
        console.log('Profile picture uploaded, URL:', profilePictureUrl);

        const userDocRef = db.collection('users').doc(user.uid);
        await userDocRef.update({
          profilePictureUrl: profilePictureUrl
        });
        console.log('Firestore updated with profile picture URL');

        updateProfilePictureUI(profilePictureUrl);
        profilePictureUpload.value = '';
        alert('Profile picture uploaded successfully!');
      } catch (error) {
        console.error('Error uploading profile picture:', error.message, error.code, error.stack);
        alert('Error uploading picture: ' + error.message);
      }
    });
  } else {
    console.error('Upload picture button not found in DOM');
  }

  // Change profile picture
  if (changePictureBtn) {
    changePictureBtn.addEventListener('click', () => {
      console.log('Change picture button clicked');
      profilePictureUpload.click();
      profilePictureUpload.addEventListener('change', () => uploadPictureBtn.click(), { once: true });
    });
  } else {
    console.error('Change picture button not found in DOM');
  }

  // Remove profile picture
  if (removePictureBtn) {
    removePictureBtn.addEventListener('click', async () => {
      console.log('Remove picture button clicked');
      const user = auth.currentUser;
      if (!user) {
        alert('You must be logged in to remove your profile picture.');
        return;
      }

      try {
        console.log('Removing profile picture for user:', user.uid);
        const userDocRef = db.collection('users').doc(user.uid);
        await userDocRef.update({
          profilePictureUrl: firebase.firestore.FieldValue.delete()
        });
        console.log('Profile picture URL removed from Firestore');

        updateProfilePictureUI(null);
        alert('Profile picture removed successfully!');
      } catch (error) {
        console.error('Error removing profile picture:', error.message, error.code, error.stack);
        alert('Error removing picture: ' + error.message);
      }
    });
  } else {
    console.error('Remove picture button not found in DOM');
  }

  // Add dietary restriction to user account
  document.getElementById('dietary-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      alert('You must be logged in to update dietary restrictions.');
      return;
    }

    const dietarySelect = document.getElementById('dietary-restrictions');
    const newRestriction = dietarySelect.value;
    if (!newRestriction) {
      alert('Please select a dietary restriction.');
      return;
    }

    try {
      console.log('Adding dietary restriction:', newRestriction);
      const userDocRef = db.collection('users').doc(user.uid);
      const userDoc = await userDocRef.get();
      const currentRestrictions = userDoc.data().dietaryRestrictions || [];
      
      if (!currentRestrictions.includes(newRestriction)) {
        const updatedRestrictions = [...currentRestrictions, newRestriction];
        await userDocRef.update({
          dietaryRestrictions: updatedRestrictions
        });
        console.log('Dietary restrictions updated in Firestore:', updatedRestrictions);
        updateDietaryDisplay(updatedRestrictions, user);
        dietarySelect.value = '';
        alert('Restriction added successfully!');
      } else {
        alert('This restriction has already been added.');
      }
    } catch (error) {
      console.error('Error adding dietary restriction:', error.message, error.code, error.stack);
      alert('Error adding restriction: ' + error.message);
    }
  });

  // Remove dietary restriction
  async function removeRestriction(event, user) {
    event.preventDefault();
    const restrictionToRemove = event.target.dataset.restriction;
    console.log('Attempting to remove:', restrictionToRemove);

    try {
      const userDocRef = db.collection('users').doc(user.uid);
      const userDoc = await userDocRef.get();
      const currentRestrictions = userDoc.data().dietaryRestrictions || [];
      
      const updatedRestrictions = currentRestrictions.filter(r => r !== restrictionToRemove);
      await userDocRef.update({
        dietaryRestrictions: updatedRestrictions
      });
      console.log('Dietary restrictions updated in Firestore:', updatedRestrictions);
      updateDietaryDisplay(updatedRestrictions, user);
      alert('Restriction removed successfully!');
    } catch (error) {
      console.error('Error removing dietary restriction:', error.message, error.code, error.stack);
      alert('Error removing restriction: ' + error.message);
    }
  }

  // Logout functionality
  document.getElementById('logout-button').addEventListener('click', async () => {
    try {
      await auth.signOut();
      console.log('Firebase logout successful');
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Logout error:', error.message);
      alert(`Error: ${error.message}`);
    }
  });

  // Dropdown toggle
  const dropdownBtn = document.querySelector('.dropbtn');
  if (dropdownBtn) {
    dropdownBtn.addEventListener('click', () => {
      document.querySelector('.dropdown-content').classList.toggle('active');
    });
  } else {
    console.warn('Dropdown button not found in DOM');
  }
});
