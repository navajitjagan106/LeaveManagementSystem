import { pool } from "./config/db";

const seed = async () => {
  try {
    console.log(" Resetting database...");

    // DROP EVERYTHING
    await pool.query(`
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS leaves CASCADE;
      DROP TABLE IF EXISTS leave_balances CASCADE;
      DROP TABLE IF EXISTS leave_types CASCADE;
      DROP TABLE IF EXISTS holidays CASCADE;
      DROP TABLE IF EXISTS users CASCADE;

      DROP TYPE IF EXISTS leave_status CASCADE;
      DROP TYPE IF EXISTS user_role CASCADE;
    `);

    console.log(" Creating schema...");

    // ENUM TYPES
    await pool.query(`
      CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
      CREATE TYPE user_role AS ENUM ('employee', 'manager', 'admin');
    `);

    // TABLES
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role user_role DEFAULT 'employee',
        manager_id INT,
        department VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE leave_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        max_days INT NOT NULL
      );

      CREATE TABLE leave_balances (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        leave_type_id INT REFERENCES leave_types(id) ON DELETE CASCADE,
        total_allocated INT DEFAULT 0,
        used INT DEFAULT 0
      );

      CREATE TABLE leaves (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        leave_type_id INT REFERENCES leave_types(id),
        from_date DATE,
        to_date DATE,
        total_days NUMERIC,
        reason TEXT,
        status leave_status DEFAULT 'pending',
        applied_to INT,
        approved_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE holidays (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        date DATE NOT NULL
      );

      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        message TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log(" Inserting users...");

  
    await pool.query(`
      INSERT INTO users (id, name, email, password, role, manager_id, department) VALUES
      (5, 'Bob', 'bob@gmail.com', '$2b$10$HtFBBG.7iEQvJUR4ygReQ.Y/MbcasJGbDD0OxLeYyA.wYvXDsgCY6', 'employee', 2, 'Products'),
      (7, 'Dragon', 'dragon@gmail.com', '$2b$10$Ebk0w.U4IlKa4V417WtLE.wPv8rtuVz5zJQmraEHE8rSA3/rspqA2', 'employee', 2, 'Products'),
      (9, 'Sundar', 'sundar@gmail.com', '$2b$10$BRa1ZR2iG96jVe9zuniwnOyBZfC5.cjoioBAHTxKfXuu5jEJFNmYy', 'employee', 8, 'Products'),
      (2, 'Manager', 'manager@gmail.com', '$2b$10$HtFBBG.7iEQvJUR4ygReQ.Y/MbcasJGbDD0OxLeYyA.wYvXDsgCY6', 'manager', 8, 'Products'),
      (8, 'Nava', 'nava@gmail.com', '$2b$10$D8FAntyQW94JH4C2TR.dtuBw7yissHRs.VsSdT5zf657UHVdjlVbi', 'manager', 3, 'Products'),
      (3, 'Navajit', 'navajit@gmail.com', '$2b$10$HtFBBG.7iEQvJUR4ygReQ.Y/MbcasJGbDD0OxLeYyA.wYvXDsgCY6', 'admin', NULL, NULL),
      (4, 'Alice', 'alice@gmail.com', '$2b$10$HtFBBG.7iEQvJUR4ygReQ.Y/MbcasJGbDD0OxLeYyA.wYvXDsgCY6', 'employee', 2, 'Products'),
      (6, 'Charlie', 'charlie@gmail.com', '$2b$10$HtFBBG.7iEQvJUR4ygReQ.Y/MbcasJGbDD0OxLeYyA.wYvXDsgCY6', 'employee', 2, 'Products');
    `);

    console.log(" Leave types...");

    await pool.query(`
      INSERT INTO leave_types (name, max_days) VALUES
      ('Sick Leave', 10),
      ('Casual Leave', 12),
      ('Earned Leave', 15);
    `);

    console.log(" Generating leave balances...");

    await pool.query(`
      INSERT INTO leave_balances (user_id, leave_type_id, total_allocated, used)
      SELECT u.id, lt.id, lt.max_days, 0
      FROM users u
      CROSS JOIN leave_types lt
      WHERE u.role = 'employee';
    `);

    console.log(" Holidays...");

    await pool.query(`
  INSERT INTO holidays (date, name) VALUES
  ('2026-01-01', 'New Year'),
  ('2026-01-14', 'Pongal'),
  ('2026-01-15', 'Makar Sankranti'),
  ('2026-01-26', 'Republic Day'),
  ('2026-02-14', 'Maha Shivaratri'),
  ('2026-03-02', 'Holi'),
  ('2026-03-20', 'Ramzan (Eid al-Fitr)'),
  ('2026-04-03', 'Good Friday'),
  ('2026-04-14', 'Tamil New Year'),
  ('2026-04-14', 'Ambedkar Jayanti'),
  ('2026-05-01', 'Labour Day'),
  ('2026-06-28', 'Bakrid (Eid al-Adha)'),
  ('2026-08-15', 'Independence Day'),
  ('2026-08-27', 'Krishna Janmashtami'),
  ('2026-09-17', 'Vinayaka Chaturthi'),
  ('2026-10-02', 'Gandhi Jayanti'),
  ('2026-10-20', 'Dussehra'),
  ('2026-11-01', 'Kannada Rajyotsava'),
  ('2026-11-08', 'Diwali'),
  ('2026-12-25', 'Christmas')
`);

    console.log("Leaves...");

    await pool.query(`
      INSERT INTO leaves 
      (user_id, leave_type_id, from_date, to_date, total_days, reason, status, applied_to)
      VALUES
      (5, 1, '2026-04-01', '2026-04-03', 3, 'Fever', 'approved', 2),
      (4, 2, '2026-04-10', '2026-04-12', 3, 'Family Function', 'pending', 2),
      (6, 3, '2026-05-01', '2026-05-02', 2, 'Vacation', 'rejected', 2);
    `);

    console.log("Updating used leaves...");

    await pool.query(`
      UPDATE leave_balances lb
      SET used = sub.total
      FROM (
        SELECT user_id, leave_type_id, SUM(total_days) AS total
        FROM leaves
        WHERE status = 'approved'
        GROUP BY user_id, leave_type_id
      ) sub
      WHERE lb.user_id = sub.user_id
      AND lb.leave_type_id = sub.leave_type_id;
    `);

    console.log(" Fixing sequences...");

    await pool.query(`
      SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
      SELECT setval('leave_types_id_seq', (SELECT MAX(id) FROM leave_types));
      SELECT setval('leave_balances_id_seq', (SELECT MAX(id) FROM leave_balances));
      SELECT setval('leaves_id_seq', (SELECT MAX(id) FROM leaves));
      SELECT setval('holidays_id_seq', (SELECT MAX(id) FROM holidays));
    `);

    console.log(" Database fully seeded!");

    process.exit(0);
  } catch (err) {
    console.error(" Error seeding:", err);
    process.exit(1);
  }
};

seed();