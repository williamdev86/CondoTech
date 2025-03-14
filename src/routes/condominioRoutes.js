const express = require('express');
const router = express.Router();
const condominioController = require('../controllers/condominioController');

// Rotas para condomínios
router.get('/', condominioController.listarCondominios);
router.get('/cadastro', condominioController.exibirFormCadastro);
router.post('/cadastrar', condominioController.cadastrarCondominio);
router.get('/editar/:id', condominioController.exibirFormEdicao);
router.post('/atualizar/:id', condominioController.atualizarCondominio);
router.post('/excluir/:id', condominioController.excluirCondominio);
router.get('/api/:id', condominioController.buscarPorId);

module.exports = router;