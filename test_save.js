const fetch = require('node-fetch');

async function testSave() {
    // First login
    const loginRes = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userEmail: 'test@example.com',
            password: 'password123'
        })
    });
    
    const loginData = await loginRes.json();
    console.log('Login:', loginRes.status, loginData.message);
    const token = loginData.token;
    
    // Try to save project 1
    console.log('\nAttempting to save project 1...');
    const saveRes = await fetch('http://localhost:3000/api/users/saved-projects', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ projectId: 1 })
    });
    
    const saveData = await saveRes.json();
    console.log('Save response status:', saveRes.status);
    console.log('Save response body:', JSON.stringify(saveData, null, 2));
    
    // Get saved projects
    console.log('\nFetching saved projects...');
    const getRes = await fetch('http://localhost:3000/api/users/saved-projects', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    
    const getData = await getRes.json();
    console.log('Get saved projects status:', getRes.status);
    console.log('Saved projects:', JSON.stringify(getData, null, 2));
}

testSave().catch(e => console.error('Error:', e));
