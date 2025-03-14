// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { autenticar, autorizar } = require('../config/jwt');
const Usuario = require('../models/usuario');

// Rota de login
router.post('/login', authController.login);

// Verificar token atual
router.get('/verificar', autenticar, authController.verificarToken);

// Gerenciamento de usuários (Admin)
router.post('/usuarios', autenticar, autorizar('Admin'), authController.criarUsuario);

// Rota para logout
router.get('/logout', authController.logout);

// Rota temporária para resetar a senha do admin
router.get('/reset-admin-password', async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(1);
    if (usuario) {
      // Método 1: Usar setDataValue para garantir que a mudança seja registrada
      usuario.setDataValue('senha', 'admin1234');
      
      // Método 2: Marcar explicitamente o campo como alterado
      usuario.changed('senha', true);
      
      // Salvar com individualHooks:true para garantir que os hooks sejam executados
      await usuario.save({ individualHooks: true });
      
      res.send('Senha do admin redefinida com sucesso');
    } else {
      res.status(404).send('Usuário admin não encontrado');
    }
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).send('Erro ao redefinir senha');
  }
});

module.exports = router;