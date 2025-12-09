require('dotenv').config();
const bcrypt = require('bcrypt');

const knex = require('knex')({
    client: 'pg',
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost",
        user: process.env.RDS_USERNAME || "postgres",
        password: process.env.RDS_PASSWORD || "Butterfingers24.",
        database: process.env.RDS_DATABASE || "aquatrack",
        port: process.env.RDS_PORT || 5433,
        ssl: process.env.RDS_HOSTNAME && process.env.RDS_HOSTNAME !== 'localhost' ? { rejectUnauthorized: false } : false
    }
});

async function createManager() {
    try {
        console.log('Creating manager account...');
        
        const email = 'manager@aquatrack.com';
        const password = 'manager123';
        const saltRounds = 10;
        
        // Check if manager already exists
        const existing = await knex('users').where('useremail', email).first();
        if (existing) {
            console.log('Manager already exists:', email);
            console.log('Current role:', existing.userrole);
            
            // Update to manager if not already
            if (existing.userrole !== 'manager') {
                await knex('users').where('useremail', email).update({ userrole: 'manager' });
                console.log('✓ Updated user to manager role');
            }
        } else {
            // Create new manager
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            await knex('users').insert({
                useremail: email,
                userfirstname: 'Manager',
                userlastname: 'Admin',
                passwordhash: hashedPassword,
                userrole: 'manager'
            });
            console.log('✓ Manager account created successfully!');
        }
        
        console.log('\nManager credentials:');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('\nYou can now log in as a manager and access the dashboard.');
        
    } catch (error) {
        console.error('Error creating manager:', error);
    } finally {
        await knex.destroy();
        process.exit();
    }
}

createManager();
