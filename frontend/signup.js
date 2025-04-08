document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await response.json();
      console.log('Backend response:', data); // Add this
      if (response.ok) {
        alert('Sign up successful! Please log in.');
        window.location.href = 'index.html';
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Signup failed:', error);
      alert('An error occurred. Please try again.');
    }
  });
