const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.gwwjjhmvrbqefvifobvs:navajitjagan@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres' });
async function seedLeaves() {
    const today = new Date();
    // Get an employee
    const res = await pool.query("SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'employee' LIMIT 1) LIMIT 1;");
    if (res.rows.length === 0) return;
    const userId = res.rows[0].id;
    // Get a leave type
    const typeRes = await pool.query("SELECT id FROM leave_types LIMIT 1;");
    const typeId = typeRes.rows[0].id;
    
    // Insert dummy approved leaves across the last 300 days
    for (let i = 0; i < 15; i++) {
        const d = new Date();
        d.setDate(today.getDate() - Math.floor(Math.random() * 300));
        const dateStr = d.toISOString().split('T')[0];
        // Insert a 1-day leave
        await pool.query(`
            INSERT INTO leaves (user_id, leave_type_id, from_date, to_date, total_days, reason, status)
            VALUES ($1, $2, $3, $4, 1, 'Dummy Leave', 'approved')
        `, [userId, typeId, dateStr, dateStr]);
    }
    // Heavy leave period
    const d2 = new Date();
    d2.setDate(today.getDate() - 45);
    const dateStr2 = d2.toISOString().split('T')[0];
    await pool.query(`
        INSERT INTO leaves (user_id, leave_type_id, from_date, to_date, total_days, reason, status)
        VALUES ($1, $2, $3, $3, 1, 'Dummy Leave Heavy', 'approved')
    `, [userId, typeId, dateStr2]);
    await pool.query(`
        INSERT INTO leaves (user_id, leave_type_id, from_date, to_date, total_days, reason, status)
        VALUES ($1, $2, $3, $3, 1, 'Dummy Leave Heavy', 'approved')
    `, [userId, typeId, dateStr2]);
    
    console.log('Seeded leaves');
    process.exit(0);
}
seedLeaves();
