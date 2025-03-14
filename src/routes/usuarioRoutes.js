// src/routes/usuarioRoutes.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { autenticar, autorizar } = require('../config/jwt');

// Adicionar log para verificar funções disponíveis
console.log('Funções disponíveis no usuarioController:', Object.keys(usuarioController));

// Aplicar autenticação em todas as rotas
router.use(autenticar);

// Apenas administradores podem gerenciar usuários
router.use(autorizar('Admin'));

// Listar todos os usuários
router.get('/', usuarioController.listarUsuarios);

// Exibir formulário de cadastro
router.get('/cadastro', usuarioController.exibirFormCadastro);

// Cadastrar novo usuário
router.post('/cadastrar', usuarioController.cadastrarUsuario);

// Exibir formulário de edição
router.get('/editar/:id', usuarioController.exibirFormEdicao);

// Atualizar usuário
router.post('/atualizar/:id', usuarioController.atualizarUsuario);

// Excluir usuário
router.post('/excluir/:id', usuarioController.excluirUsuario);

// Alternar status (ativar/desativar)
router.post('/alternar-status/:id', usuarioController.alternarStatus);

module.exports = router;