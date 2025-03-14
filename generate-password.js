// generate-password.js
const bcrypt = require('bcryptjs');

const senha = 'admin123'; // Altere para a senha que deseja
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(senha, salt);

console.log('Sua senha hash é:');
console.log(hash);