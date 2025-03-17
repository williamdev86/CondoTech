// src/routes/clienteRoutes.js
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { autenticar, autorizar } = require('../config/jwt');
const multer = require('multer');

// Configuração do Multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas arquivos Excel
    if (
      file.mimetype === 'application/vnd.ms-excel' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel (.xls ou .xlsx) são permitidos'), false);
    }
  }
});

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

// Exportar clientes para Excel
if (clienteController.exportarExcel) {
    router.get('/exportar-excel', clienteController.exportarExcel);
} else {
    console.warn('ATENÇÃO: Função exportarExcel não encontrada no clienteController');
    router.get('/exportar-excel', (req, res) => {
        res.send('Exportação para Excel em desenvolvimento');
    });
}

// Rotas para importação de planilha
if (clienteController.exibirFormImportacao) {
    router.get('/importar', clienteController.exibirFormImportacao);
} else {
    console.warn('ATENÇÃO: Função exibirFormImportacao não encontrada no clienteController');
    router.get('/importar', (req, res) => {
        res.send('Formulário de importação em desenvolvimento');
    });
}

if (clienteController.processarImportacao) {
    router.post('/processar-importacao', upload.single('arquivo'), clienteController.processarImportacao);
} else {
    console.warn('ATENÇÃO: Função processarImportacao não encontrada no clienteController');
    router.post('/processar-importacao', (req, res) => {
        res.send('Processamento de importação em desenvolvimento');
    });
}

if (clienteController.confirmarImportacao) {
    router.post('/confirmar-importacao', clienteController.confirmarImportacao);
} else {
    console.warn('ATENÇÃO: Função confirmarImportacao não encontrada no clienteController');
    router.post('/confirmar-importacao', (req, res) => {
        res.send('Confirmação de importação em desenvolvimento');
    });
}

module.exports = router;