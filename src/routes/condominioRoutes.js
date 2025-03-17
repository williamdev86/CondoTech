const express = require('express');
const router = express.Router();
const condominioController = require('../controllers/condominioController');
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

// Rotas para condomínios
router.get('/', condominioController.listarCondominios);
router.get('/cadastro', condominioController.exibirFormCadastro);
router.post('/cadastrar', condominioController.cadastrarCondominio);
router.get('/editar/:id', condominioController.exibirFormEdicao);
router.post('/atualizar/:id', condominioController.atualizarCondominio);
router.post('/excluir/:id', condominioController.excluirCondominio);
router.get('/api/:id', condominioController.buscarPorId);
router.get('/exportar-excel', condominioController.exportarExcel);

// Rotas para importação de planilha
router.get('/importar', condominioController.exibirFormImportacao);
router.post('/processar-importacao', upload.single('arquivo'), condominioController.processarImportacao);
router.post('/confirmar-importacao', condominioController.confirmarImportacao);

module.exports = router;