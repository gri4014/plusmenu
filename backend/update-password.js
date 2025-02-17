const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

async function updatePassword() {
    const pool = new Pool({
        host: 'localhost',
        database: 'plusmenu',
        port: 5432
    });

    try {
        const password = 'Admin@123';
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);
        
        console.log('Generated hash:', hash);
        console.log('Verification:', await bcrypt.compare(password, hash));
        
        const client = await pool.connect();
        try {
            await client.query('UPDATE developers SET password_hash = $1 WHERE login = $2', [hash, 'admin']);
            console.log('Password updated successfully');
            
            const result = await client.query('SELECT password_hash FROM developers WHERE login = $1', ['admin']);
            console.log('Stored hash:', result.rows[0].password_hash);
            console.log('Final verification:', await bcrypt.compare(password, result.rows[0].password_hash));
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

updatePassword();
