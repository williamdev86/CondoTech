// src/routes/clienteRoutes.js
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { autenticar, autorizar } = require('../config/jwt');

// Verificar quais funções estão disponíveis
console.log('Funções disponíveis no clienteController:', Object.keys(clienteController));

// Aplicar autenticação em todas as rotas
router.use(autenticar);

// Listar todos os clientes
if (clienteController.listarClientes) {
    router.get('/', clienteController.listarClientes);
} else {
    console.warn('ATENÇÃO: Função listarClientes não encontrada no clienteController');
    router.get('/', (req, res) => {
        res.send('Listagem de clientes em desenvolvimento');
    });
}

// Exibir formulário de cadastro
if (clienteController.exibirFormCadastro) {
    router.get('/cadastro', clienteController.exibirFormCadastro);
} else {
    console.warn('ATENÇÃO: Função exibirFormCadastro não encontrada no clienteController');
    router.get('/cadastro', (req, res) => {
        res.send('Formulário de cadastro em desenvolvimento');
    });
}

// Cadastrar novo cliente
if (clienteController.cadastrarCliente) {
    router.post('/cadastrar', clienteController.cadastrarCliente);
} else {
    console.warn('ATENÇÃO: Função cadastrarCliente não encontrada no clienteController');
    router.post('/cadastrar', (req, res) => {
        res.send('Função de cadastro em desenvolvimento');
    });
}

// Exibir formulário de edição
if (clienteController.exibirFormEdicao) {
    router.get('/editar/:id', clienteController.exibirFormEdicao);
} else {
    console.warn('ATENÇÃO: Função exibirFormEdicao não encontrada no clienteController');
    router.get('/editar/:id', (req, res) => {
        res.send('Formulário de edição em desenvolvimento');
    });
}

// Atualizar cliente
if (clienteController.atualizarCliente) {
    router.post('/atualizar/:id', clienteController.atualizarCliente);
} else {
    console.warn('ATENÇÃO: Função atualizarCliente não encontrada no clienteController');
    router.post('/atualizar/:id', (req, res) => {
        res.send('Função de atualização em desenvolvimento');
    });
}

// Excluir cliente
if (clienteController.excluirCliente) {
    router.post('/excluir/:id', clienteController.excluirCliente);
} else {
    console.warn('ATENÇÃO: Função excluirCliente não encontrada no clienteController');
    router.post('/excluir/:id', (req, res) => {
        res.send('Função de exclusão em desenvolvimento');
    });
}

// Buscar clientes por condomínio (rota de API)
if (clienteController.buscarPorCondominio) {
    router.get('/por-condominio/:condominioId', clienteController.buscarPorCondominio);
} else {
    console.warn('ATENÇÃO: Função buscarPorCondominio não encontrada no clienteController');
    router.get('/por-condominio/:condominioId', (req, res) => {
        res.json([]);
    });
}

module.exports = router;