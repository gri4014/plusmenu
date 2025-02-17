const bcrypt = require('bcrypt');

async function verifyPassword() {
  const storedHash = '$2a$10$YcmQGOcBF3MEYnfj/sBHPuZxZtO5AExl4.qpXEfvrPhKMnHVGD.Hy';
  const password = 'Admin@123';

  try {
    const isMatch = await bcrypt.compare(password, storedHash);
    console.log('Password:', password);
    console.log('Stored Hash:', storedHash);
    console.log('Match:', isMatch);
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyPassword();
