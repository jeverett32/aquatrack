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

async function inspectSchema() {
    try {
        console.log("Checking tables...");
        const tables = await knex.raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Tables found:", tables.rows.map(t => t.table_name));

        for (const table of tables.rows) {
            const tableName = table.table_name;
            console.log(`\nColumns for table '${tableName}':`);
            const columns = await knex.raw(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}'`);
            console.log(columns.rows);
        }

    } catch (err) {
        console.error("Error inspecting schema:", err);
    } finally {
        knex.destroy();
    }
}

inspectSchema();
