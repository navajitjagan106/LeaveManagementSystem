const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'role_permissions' ORDER BY ordinal_position").then(r => {
    console.log(r.rows);
    process.exit(0);
});
