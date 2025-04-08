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

// Function to update UI based on auth state
function updateAuthUI(user) {
  const signInSection = document.getElementById("sign-in-sign-up");
  const signOutSection = document.getElementById("sign-out-section");
  if (user) {
    console.log('User is signed in:', user.uid);
    signInSection.style.display = "none";
    signOutSection.style.display = "block";
    updateUserStatus();
  } else {
    console.log('No user signed in');
    signInSection.style.display = "block";
    signOutSection.style.display = "none";
  }
}

// Check auth state on page load
auth.onAuthStateChanged((user) => {
  console.log('Auth state changed:', user ? user.uid : 'null');
  updateAuthUI(user);
});

// Login functionality with Firebase
document.getElementById("login-form").addEventListener("submit", async function (event) {
    event.preventDefault(); 
    console.log('Form submit event triggered'); 
  
    const username = document.getElementById("username").value; 
    const password = document.getElementById("password").value;
    console.log('Login attempt:', { username, password });
  
    if (!username || !password) {
      console.log('Missing username or password');
      alert('Please enter both username and password');
      return;
    }
  
    try {
      console.log('Attempting Firebase login');
      const userCredential = await auth.signInWithEmailAndPassword(username, password);
      console.log('Firebase login successful, UID:', userCredential.user.uid);
      const idToken = await userCredential.user.getIdToken();
      console.log('ID Token retrieved:', idToken);
  
      console.log('Sending request to backend');
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ idToken })
      });
  
      console.log('Response received, status:', response.status);
      const data = await response.json();
      console.log('Backend response:', data);
  
      if (response.ok && data.token) {
        localStorage.setItem("token", data.token);
        document.getElementById("sign-in-sign-up").style.display = "none";
        document.getElementById("sign-out-section").style.display = "block";
        updateUserStatus();
        console.log('Login success block reached');
        alert("Login successful! Welcome back!"); 
      } else {
        console.log('Login failed with response:', data);
        alert(data.error || "Login failed");
      }
    } catch (error) {
      console.error('Login error:', error.message, error.code); 
      alert(`Error: ${error.message}`);
    }
  });

// Update user status
async function updateUserStatus() {
  const token = localStorage.getItem("token");
  if (!token) {
    return;
  }
  try {
    const response = await fetch("/api/status", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    const statusElement = document.getElementById("auth-status");
    if (data.active) {
      statusElement.textContent = "Active";
      statusElement.style.color = "green";
    } else {
      statusElement.textContent = "Inactive";
      statusElement.style.color = "red";
    }
  } catch (error) {
    console.error('Status update error:', error);
  }
}

// Logout with Firebase
document.getElementById("logout-button").addEventListener("click", async function () {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("You are not logged in.");
    return;
  }

  try {
    await auth.signOut();
    console.log('Firebase logout successful');

    await fetch("http://localhost:5000/api/auth/logout", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    localStorage.removeItem("token");
    document.getElementById("sign-in-sign-up").style.display = "block";
    document.getElementById("sign-out-section").style.display = "none";
    alert("You have been logged out.");
  } catch (error) {
    console.error('Logout error:', error.message);
    alert(`Error: ${error.message}`);
  }
});

// Redirect to settings
function redirectToSettings() {
  window.location.href = "settings.html";
}

document.getElementById("forgot-password-link").addEventListener("click", function (event) {
  event.preventDefault();
  redirectToSettings();
});

document.getElementById("update-dietary-preferences")?.addEventListener("click", function (event) {
  event.preventDefault();
  redirectToSettings();
});

document.getElementById("update-email-password")?.addEventListener("click", function (event) {
  event.preventDefault();
  redirectToSettings();
});

// Search preferences
function searchPreferences() {
  const dietaryInput = document.getElementById('dietary-preference').value;
  console.log(`Searching for restaurants with dietary preference: ${dietaryInput}`);
  const restaurantData = [
    { name: "Vegan Bistro", type: "Vegan", location: "123 Plant St" },
    { name: "Gluten-Free Bakery", type: "Gluten-Free", location: "456 Grain Ave" }
  ];
  displayRestaurants(restaurantData);
}

// Logo link
document.getElementById("logo-link")?.addEventListener("click", function (event) {
  event.preventDefault();
  window.location.href = '/';
});

// Display restaurants
function displayRestaurants(data) {
  const restaurantList = document.getElementById('restaurant-list');
  if (restaurantList) {
    restaurantList.innerHTML = '';
    data.forEach(restaurant => {
      const listItem = document.createElement('li');
      listItem.textContent = `${restaurant.name} - ${restaurant.type} (${restaurant.location})`;
      restaurantList.appendChild(listItem);
    });
  }
}

// Share recipe function
function shareRecipe(event) {
  event.preventDefault();
  const recipeName = document.getElementById('recipe-name')?.value;
  const recipeInstructions = document.getElementById('recipe-instructions')?.value;
  if (recipeName && recipeInstructions) {
    console.log(`Sharing recipe: ${recipeName}`);
    const sharedRecipeList = document.getElementById('shared-recipe-list');
    if (sharedRecipeList) {
      const recipeItem = document.createElement('li');
      recipeItem.textContent = `${recipeName}: ${recipeInstructions}`;
      sharedRecipeList.appendChild(recipeItem);
      document.getElementById('share-recipe-form').reset();
    }
  }
}

// Map initialization
function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: { lat: 40.280, lng: -74.006 },
    mapTypeControl: true,
    streetViewControl: true,
  });

  const marker = new google.maps.Marker({
    position: { lat: 40.280, lng: -74.006 },
    map: map,
    title: "Example Location"
  });

  const infoWindow = new google.maps.InfoWindow({
    content: '<h3>Example Location</h3><p>This is a default location.</p>',
  });

  marker.addListener('click', () => {
    infoWindow.open(map, marker);
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        map.setCenter(userLocation);
        const userMarker = new google.maps.Marker({
          position: userLocation,
          map: map,
          title: 'Your Location',
        });
        const userInfoWindow = new google.maps.InfoWindow({
          content: '<h3>Your Location</h3><p>This is where you are currently located.</p>',
        });
        userMarker.addListener('click', () => {
          userInfoWindow.open(map, userMarker);
        });
      },
      () => {
        console.error('Geolocation failed');
      }
    );
  } else {
    console.error('Geolocation is not supported by this browser.');
  }

  // These are fallback restaurants used for testing purposes
  const restaurants = [
    { name: "Atillo Pizzeria", lat: 40.27030, lng: -74.01519, address: "67 Monmouth Rd, Oakhurst, NJ 07755", cuisine: "Italian", rating: 4.0, phone: "(732)-222-5655", details: "-Pizzeria <br> -Vegetarian Options" },
    { name: "Gianni's Pizzeria", lat: 40.27084, lng: -74.01605, address: "56 Monmouth Rd, Oakhurst, NJ 07755", cuisine: "Italian", rating: 4.5, phone: "(732)-728-7004", details: "-Pizzeria <br> -Vegetarian Options" },
    { name: "Puerto Escondido", lat: 40.29436, lng: -74.02842, address: "175 Monmouth Rd Unit 1, West Long Branch, NJ 07764", cuisine: "Mexican", rating: 4.5, phone: "(732)-272-1584", details: "-Mexican <br> -Vegetarian Options <br> -Vegan Options" },
    { name: "Gigi's NY Style Pizza and Restaurant", lat: 40.28441, lng: -73.98842, address: "140 Brighton Ave, Long Branch, NJ 07740", cuisine: "Italian", rating: 4.5, phone: "(732)-377-2468", details: "-Pizzeria <br> -Vegetarian Options <br> -Vegan Options <br> -Gluten Free Options" },
    { name: "Mi Pueblo Querido Mexican", lat: 40.30018, lng: -74.00082, address: "551 Broadway, Long Branch, NJ 07740", cuisine: "Mexican", rating: 5.0, phone: "(732)-483-6606", details: "-Mexican <br> -Vegetarian Options" },
    { name: "Chick-fil-A", lat: 40.25374, lng: -74.03933, address: "1613 State Highway 35, Oakhurst, NJ 07755", cuisine: "Fast Food", rating: 5.0, phone: "(732)-769-4232", details: "-Fast Food <br> -Vegetarian Options <br> -Vegan Options" },
  ];

  restaurants.forEach(restaurant => {
    const marker = new google.maps.Marker({
      position: { lat: restaurant.lat, lng: restaurant.lng },
      map: map,
      title: restaurant.name,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<h3>${restaurant.name}</h3><p>${restaurant.details}</p>`,
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
      document.getElementById('restaurant-name').textContent = `Name: ${restaurant.name}`;
      document.getElementById('restaurant-address').textContent = `Address: ${restaurant.address}`;
      document.getElementById('restaurant-cuisine').textContent = `Cuisine: ${restaurant.cuisine}`;
      document.getElementById('restaurant-rating').textContent = `Rating: ${restaurant.rating}`;
      document.getElementById('restaurant-phone').textContent = `Phone: ${restaurant.phone}`;
    });

    marker.addListener('mouseover', () => {
      infoWindow.open(map, marker);
    });

    marker.addListener('mouseout', () => {
      infoWindow.close();
    });
  });

  const input = document.createElement('input');
  input.setAttribute('id', 'pac-input');
  input.setAttribute('type', 'text');
  input.setAttribute('placeholder', 'Search for restaurants...');
  document.getElementById('map-container')?.appendChild(input);
  const searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  map.addListener('bounds_changed', () => {
    searchBox.setBounds(map.getBounds());
  });

  searchBox.addListener('places_changed', () => {
    const places = searchBox.getPlaces();
    if (places.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    places.forEach((place) => {
      if (!place.geometry) return;
      new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        title: place.name,
      });
      bounds.extend(place.geometry.location);
    });
    map.fitBounds(bounds);
  });
}

// Event listeners
document.getElementById('search-button').addEventListener('click', searchPreferences);
document.getElementById('share-recipe-form')?.addEventListener('submit', shareRecipe);
