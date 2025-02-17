const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function updateAdminPassword() {
  const pool = new Pool({
    user: 'grigorii',
    database: 'plusmenu'
  });

  try {
    const password = 'Admin@123';
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    console.log('Updating admin password...');
    console.log('New hash:', hash);

    const result = await pool.query(
      'UPDATE developers SET password_hash = $1 WHERE login = $2 RETURNING *',
      [hash, 'admin']
    );

    if (result.rows.length > 0) {
      console.log('Admin password updated successfully');
      console.log('Updated record:', result.rows[0]);
    } else {
      console.log('Admin user not found');
    }
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await pool.end();
  }
}

updateAdminPassword();
