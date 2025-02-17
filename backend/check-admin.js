const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'plusmenu',
  user: 'grigorii',
  password: 'postgres'
});

async function checkAdmin() {
  try {
    const result = await pool.query('SELECT login, password_hash FROM developers WHERE login = $1', ['admin']);
    if (result.rows.length > 0) {
      console.log('Admin found:');
      console.log('Login:', result.rows[0].login);
      console.log('Password hash:', result.rows[0].password_hash);
    } else {
      console.log('Admin not found');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkAdmin();
