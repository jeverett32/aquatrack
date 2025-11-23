const fetch = require('node-fetch');

async function testLogin() {
    const email = 'test@example.com'; // Replace with a known valid email if needed, or register one first
    const password = 'password123';

    console.log('Attempting registration to ensure user exists...');
    try {
        const regRes = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userEmail: email,
                userFirstName: 'Test',
                userLastName: 'User',
                password: password
            })
        });
        const regData = await regRes.json();
        console.log('Registration response:', regRes.status, regData);
    } catch (e) {
        console.log('Registration failed (might already exist):', e.message);
    }

    console.log('\nAttempting login...');
    try {
        const loginRes = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userEmail: email,
                password: password
            })
        });

        const loginData = await loginRes.json();
        console.log('Login response status:', loginRes.status);
        console.log('Login response body:', JSON.stringify(loginData, null, 2));
    } catch (e) {
        console.error('Login request failed:', e);
    }
}

testLogin();
