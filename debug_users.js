require('dotenv').config();
const knex = require('knex')({
    client: 'pg',
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost",
        user: process.env.RDS_USERNAME || "postgres",
        password: process.env.RDS_PASSWORD || "Butterfingers24.",
        database: process.env.RDS_DATABASE || "aquatrack",
        port: process.env.RDS_PORT || 5433
    }
});

async function inspect() {
    try {
        const columns = await knex('information_schema.columns')
            .where({ table_name: 'users' })
            .select('column_name', 'data_type');
        console.log('Users table columns:', columns);
    } catch (err) {
        console.error(err);
    } finally {
        knex.destroy();
    }
}

inspect();
