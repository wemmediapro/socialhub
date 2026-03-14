// Script temporaire pour créer l'utilisateur admin
const fetch = require('node-fetch');

async function createAdmin() {
  try {
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@mediapro.com',
        login: 'admin',
        password: 'admin123',
        role: 'admin',
        isActive: true,
        projectIds: [],
        notifications: {
          email: true,
          push: false
        }
      })
    });

    const result = await response.json();
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdmin();
