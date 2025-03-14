// src/routes/chamadoRoutes.js
const express = require('express');
const router = express.Router();
const chamadoController = require('../controllers/chamadoController');
const { autenticar, autorizar } = require('../config/jwt');

// Verificação de quais métodos estão disponíveis
const availableMethods = Object.keys(chamadoController);
console.log('Funções disponíveis no chamadoController:', availableMethods);

// Função para verificar se um método existe
const safeRoute = (method, fallback) => {
  if (chamadoController[method]) {
    return chamadoController[method];
  } else {
    console.warn(`AVISO: Função ${method} não encontrada no chamadoController, usando fallback`);
    return fallback || ((req, res) => {
      res.send(`<h1>Funcionalidade em desenvolvimento</h1>
               <p>A função "${method}" ainda não foi implementada.</p>
               <a href="/" class="btn btn-primary">Voltar para o início</a>`);
    });
  }
};

// Aplicar middleware de autenticação para todas as rotas
router.use(autenticar);

// Rotas acessíveis a todos os usuários autenticados
router.get('/', safeRoute('listarChamados'));

// Rotas para visualização
router.get('/visualizar/:id', safeRoute('visualizarChamado'));

// Rotas para criação de chamados - todos podem criar
router.get('/cadastro', safeRoute('exibirFormCadastro'));
router.post('/cadastrar', safeRoute('cadastrarChamado'));

// Rotas para edição de chamados
router.get('/editar/:id', safeRoute('exibirFormEdicao'));
router.post('/atualizar/:id', safeRoute('atualizarChamado'));

// Rota para dashboard - acessível apenas para admin e síndico
router.get('/dashboard', autorizar('Admin', 'Sindico'), safeRoute('dashboard'));

// Rota para excluir chamados - apenas admin
router.post('/excluir/:id', autorizar('Admin'), safeRoute('excluirChamado'));

// Rota para relatórios - apenas síndico e admin
router.get('/relatorio', autorizar('Admin', 'Sindico'), safeRoute('relatorio'));

// Rota para buscar clientes por condomínio (API)
router.get('/api/clientes/:condominioId', safeRoute('buscarClientesPorCondominio', (req, res) => {
  // Fallback específico para API
  res.json([]);
}));

// Rota para adicionar comentários
router.post('/comentario/:id', safeRoute('adicionarComentario'));

module.exports = router;