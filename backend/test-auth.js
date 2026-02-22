import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001/api/auth';

async function testAuth() {
    console.log('Testing Authentication Endpoints...');

    // Random email to avoid conflicts
    const email = `test${Date.now()}@example.com`;
    const password = 'password123';
    const name = 'Test User';

    try {
        // 1. Register
        console.log(`\n1. Testing Registration (${email})...`);
        const registerResponse = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
        });

        const registerData = await registerResponse.json();

        if (registerResponse.ok && registerData.success) {
            console.log('✅ Registration Successful');
        } else {
            console.error('❌ Registration Failed:', registerData);
            return;
        }

        // 2. Login
        console.log(`\n2. Testing Login...`);
        const loginResponse = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok && loginData.success) {
            console.log('✅ Login Successful');
            console.log('Token received:', loginData.data.token ? 'Yes' : 'No');
        } else {
            console.error('❌ Login Failed:', loginData);
        }

    } catch (error) {
        console.error('❌ Error during test:', error.message);
    }
}

testAuth();
