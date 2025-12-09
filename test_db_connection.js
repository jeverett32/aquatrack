require('dotenv').config();

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

async function testConnection() {
    try {
        console.log('Testing database connection...');
        console.log('Host:', process.env.RDS_HOSTNAME || "localhost");
        console.log('Port:', process.env.RDS_PORT || 5433);
        console.log('Database:', process.env.RDS_DATABASE || "aquatrack");
        console.log('User:', process.env.RDS_USERNAME || "postgres");
        
        // Test basic connection
        const result = await knex.raw('SELECT 1+1 AS result');
        console.log('✓ Database connection successful!');
        
        // Test partners table
        const partners = await knex('partners').select('*');
        console.log(`✓ Found ${partners.length} partners`);
        if (partners.length > 0) {
            console.log('  Sample:', partners[0]);
        }
        
        // Test users table
        const users = await knex('users').select('userid', 'useremail', 'userrole');
        console.log(`✓ Found ${users.length} users`);
        if (users.length > 0) {
            console.log('  Sample:', users[0]);
        }
        
        // Test well_projects table
        const projects = await knex('well_projects').select('*');
        console.log(`✓ Found ${projects.length} well_projects`);
        if (projects.length > 0) {
            console.log('  Sample:', projects[0]);
        }
        
        console.log('\nAll tests passed! Database is ready to use.');
        
    } catch (error) {
        console.error('✗ Database connection failed!');
        console.error('Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await knex.destroy();
        process.exit();
    }
}

testConnection();
