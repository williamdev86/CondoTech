const Condominio = require('../models/condominio');
const XLSX = require('xlsx');

// Listar todos os condomínios
exports.listarCondominios = async (req, res) => {
  try {
    const condominios = await Condominio.findAll({
      order: [['nome', 'ASC']]
    });
    
    res.render('condominios/index', {
      title: 'Condomínios',
      condominios,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao listar condomínios:', error);
    req.flash('error', 'Erro ao listar condomínios');
    res.redirect('/');
  }
};

// Renderizar formulário de cadastro
exports.exibirFormCadastro = (req, res) => {
  res.render('condominios/cadastro', {
    title: 'Cadastrar Condomínio',
    condominio: {},
    messages: req.flash()
  });
};

// Cadastrar novo condomínio
exports.cadastrarCondominio = async (req, res) => {
  try {
    const {
      nome,
      endereco,
      cidade,
      estado,
      cep,
      telefone,
      email,
      sindico,
      observacoes,
      status
    } = req.body;

    await Condominio.create({
      nome,
      endereco,
      cidade,
      estado,
      cep,
      telefone,
      email,
      sindico,
      observacoes,
      status: status || 'Ativo'
    });

    req.flash('success', 'Condomínio cadastrado com sucesso!');
    res.redirect('/condominios');
  } catch (error) {
    console.error('Erro ao cadastrar condomínio:', error);
    req.flash('error', 'Erro ao cadastrar condomínio');
    res.redirect('/condominios/cadastro');
  }
};

// Renderizar formulário de edição
exports.exibirFormEdicao = async (req, res) => {
  try {
    const { id } = req.params;
    const condominio = await Condominio.findByPk(id);

    if (!condominio) {
      req.flash('error', 'Condomínio não encontrado');
      return res.redirect('/condominios');
    }

    res.render('condominios/editar', {
      title: 'Editar Condomínio',
      condominio,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de edição:', error);
    req.flash('error', 'Erro ao carregar dados do condomínio');
    res.redirect('/condominios');
  }
};

// Atualizar condomínio
exports.atualizarCondominio = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      endereco,
      cidade,
      estado,
      cep,
      telefone,
      email,
      sindico,
      observacoes,
      status
    } = req.body;

    const condominio = await Condominio.findByPk(id);

    if (!condominio) {
      req.flash('error', 'Condomínio não encontrado');
      return res.redirect('/condominios');
    }

    await condominio.update({
      nome,
      endereco,
      cidade,
      estado,
      cep,
      telefone,
      email,
      sindico,
      observacoes,
      status
    });

    req.flash('success', 'Condomínio atualizado com sucesso!');
    res.redirect('/condominios');
  } catch (error) {
    console.error('Erro ao atualizar condomínio:', error);
    req.flash('error', 'Erro ao atualizar condomínio');
    res.redirect(`/condominios/editar/${req.params.id}`);
  }
};

// Excluir condomínio
exports.excluirCondominio = async (req, res) => {
  try {
    const { id } = req.params;
    const condominio = await Condominio.findByPk(id);

    if (!condominio) {
      req.flash('error', 'Condomínio não encontrado');
      return res.redirect('/condominios');
    }

    await condominio.destroy();
    req.flash('success', 'Condomínio excluído com sucesso!');
    res.redirect('/condominios');
  } catch (error) {
    console.error('Erro ao excluir condomínio:', error);
    req.flash('error', 'Erro ao excluir condomínio. Verifique se não há clientes vinculados.');
    res.redirect('/condominios');
  }
};

// Buscar condomínio por ID (para APIs)
exports.buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const condominio = await Condominio.findByPk(id);

    if (!condominio) {
      return res.status(404).json({ message: 'Condomínio não encontrado' });
    }

    res.json(condominio);
  } catch (error) {
    console.error('Erro ao buscar condomínio:', error);
    res.status(500).json({ message: 'Erro ao buscar condomínio' });
  }
};

// ===== FUNÇÕES DE IMPORTAÇÃO DE PLANILHA EXCEL =====

// Exibir formulário de importação
exports.exibirFormImportacao = (req, res) => {
  res.render('condominios/importar', {
    title: 'Importar Condomínios',
    messages: req.flash()
  });
};

// Processar arquivo de importação
exports.processarImportacao = async (req, res) => {
  try {
    // Verificar se o arquivo foi enviado
    if (!req.file) {
      req.flash('error', 'Nenhum arquivo foi enviado');
      return res.redirect('/condominios/importar');
    }

    // Ler o arquivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      req.flash('error', 'A planilha não contém dados');
      return res.redirect('/condominios/importar');
    }

    // Obter valores padrão do formulário
    const {
      cidade_padrao,
      estado_padrao,
      telefone_padrao,
      email_padrao,
      sindico_padrao,
      status_padrao
    } = req.body;

    // Mapear os dados da planilha para o formato do modelo
    const condominiosPreview = data.map(row => {
      // Tentar encontrar as colunas com diferentes possíveis nomes
      const nome = row['Nome do Condomínio'] || row['NOME DO CONDOMÍNIO'] || row['nome'] || row['Nome'] || row['NOME'] || '';
      const endereco = row['Endereço'] || row['ENDEREÇO'] || row['endereco'] || row['Endereco'] || '';
      const cep = row['CEP'] || row['cep'] || '';
      const zelador = row['Nome do Zelador'] || row['NOME DO ZELADOR'] || row['zelador'] || row['Zelador'] || null;
      
      // Verificar se há informações adicionais na planilha
      const cidade = row['Cidade'] || row['CIDADE'] || row['cidade'] || cidade_padrao;
      const estado = row['Estado'] || row['ESTADO'] || row['estado'] || row['UF'] || row['uf'] || estado_padrao;
      const telefone = row['Telefone'] || row['TELEFONE'] || row['telefone'] || telefone_padrao;
      const email = row['Email'] || row['EMAIL'] || row['email'] || email_padrao;
      const sindico = row['Síndico'] || row['SÍNDICO'] || row['sindico'] || row['Sindico'] || sindico_padrao;
      
      return {
        nome,
        endereco,
        cidade,
        estado,
        cep,
        telefone,
        email,
        sindico,
        zelador,
        status: status_padrao
      };
    });

    // Validar dados básicos
    const dadosValidos = condominiosPreview.filter(item => 
      item.nome && item.endereco && item.cep
    );

    if (dadosValidos.length === 0) {
      req.flash('error', 'Nenhum dado válido foi encontrado na planilha. Verifique se as colunas estão nomeadas corretamente.');
      return res.redirect('/condominios/importar');
    }

    // Renderizar a página com a pré-visualização dos dados
    res.render('condominios/importar', {
      title: 'Pré-visualização da Importação',
      preview: dadosValidos,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao processar arquivo de importação:', error);
    req.flash('error', `Erro ao processar arquivo: ${error.message}`);
    res.redirect('/condominios/importar');
  }
};

// Confirmar e salvar os dados de importação
exports.confirmarImportacao = async (req, res) => {
  try {
    // Obter dados do formulário
    const { dados } = req.body;
    let condominiosList = [];
    
    try {
      condominiosList = JSON.parse(dados);
    } catch (e) {
      req.flash('error', 'Erro ao processar os dados de importação');
      return res.redirect('/condominios/importar');
    }

    // Resultados da importação
    const resultados = {
      importados: 0,
      erros: []
    };

    // Salvar cada condomínio
    for (const condominio of condominiosList) {
      try {
        // Verificar se já existe um condomínio com o mesmo nome
        const existente = await Condominio.findOne({ 
          where: { nome: condominio.nome } 
        });
        
        if (existente) {
          resultados.erros.push(`Condomínio "${condominio.nome}" já existe no banco de dados`);
          continue;
        }
        
        await Condominio.create({
          nome: condominio.nome,
          endereco: condominio.endereco,
          cidade: condominio.cidade,
          estado: condominio.estado,
          cep: condominio.cep,
          telefone: condominio.telefone,
          email: condominio.email,
          sindico: condominio.sindico,
          zelador: condominio.zelador,
          status: condominio.status
        });
        resultados.importados++;
      } catch (error) {
        resultados.erros.push(`Erro ao importar ${condominio.nome}: ${error.message}`);
      }
    }

    // Renderizar resultados
    res.render('condominios/importar', {
      title: 'Resultados da Importação',
      resultados,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro na confirmação da importação:', error);
    req.flash('error', `Erro ao importar condomínios: ${error.message}`);
    res.redirect('/condominios/importar');
  }
};

// Exportar condomínios para Excel (com suporte a filtros)
exports.exportarExcel = async (req, res) => {
  try {
    // Importar Op do Sequelize para operações complexas de busca
    const { Op } = require('sequelize');
    
    // Obter parâmetros de filtro
    const { status, busca } = req.query;
    
    // Construir as condições de busca
    const whereConditions = {};
    
    // Filtrar por status
    if (status && status !== 'todos') {
      whereConditions.status = status;
    }
    
    // Filtrar por texto de busca
    if (busca && busca.trim() !== '') {
      const textoBusca = busca.trim();
      whereConditions[Op.or] = [
        { nome: { [Op.like]: `%${textoBusca}%` } },
        { endereco: { [Op.like]: `%${textoBusca}%` } },
        { cep: { [Op.like]: `%${textoBusca}%` } },
        { cidade: { [Op.like]: `%${textoBusca}%` } },
        { sindico: { [Op.like]: `%${textoBusca}%` } }
      ];
    }
    
    // Buscar condomínios com os filtros aplicados
    const condominios = await Condominio.findAll({
      where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
      order: [['nome', 'ASC']]
    });
    
    if (!condominios || condominios.length === 0) {
      req.flash('error', 'Não há condomínios para exportar com os filtros aplicados');
      return res.redirect('/condominios');
    }
    
    // Transformar os dados para o formato adequado para o Excel
    const dadosParaExcel = condominios.map(cond => {
      // Retornar apenas os dados desejados, sem metadados do Sequelize
      return {
        'ID': cond.id,
        'Nome': cond.nome,
        'Endereço': cond.endereco,
        'CEP': cond.cep,
        'Cidade': cond.cidade,
        'Estado': cond.estado,
        'Telefone': cond.telefone,
        'Email': cond.email,
        'Síndico': cond.sindico,
        'Zelador': cond.zelador || '',
        'Status': cond.status,
        'Data de Cadastro': cond.createdAt ? new Date(cond.createdAt).toLocaleString('pt-BR') : '',
        'Última Atualização': cond.updatedAt ? new Date(cond.updatedAt).toLocaleString('pt-BR') : ''
      };
    });
    
    // Criar uma planilha com os dados
    const ws = XLSX.utils.json_to_sheet(dadosParaExcel);
    
    // Configurar a largura das colunas
    const wscols = [
      {wch: 5},  // ID
      {wch: 30}, // Nome
      {wch: 40}, // Endereço
      {wch: 10}, // CEP
      {wch: 15}, // Cidade
      {wch: 5},  // Estado
      {wch: 15}, // Telefone
      {wch: 25}, // Email
      {wch: 20}, // Síndico
      {wch: 20}, // Zelador
      {wch: 15}, // Status
      {wch: 20}, // Data de Cadastro
      {wch: 20}  // Última Atualização
    ];
    ws['!cols'] = wscols;
    
    // Criar um novo workbook e adicionar a planilha
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Condomínios');
    
    // Adicionar informações sobre os filtros aplicados em uma nova planilha
    const filtrosWs = XLSX.utils.aoa_to_sheet([
      ['Filtros Aplicados'],
      ['Data de exportação', new Date().toLocaleString('pt-BR')],
      ['Status', status || 'Todos'],
      ['Termo de busca', busca || 'Nenhum'],
      ['Total de registros', condominios.length.toString()]
    ]);
    
    XLSX.utils.book_append_sheet(wb, filtrosWs, 'Informações');
    
    // Gerar o buffer do arquivo Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    // Definir o nome do arquivo com a data atual
    const dataAtual = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const statusSufixo = status && status !== 'todos' ? `_${status}` : '';
    const nomeArquivo = `condominios${statusSufixo}_${dataAtual}.xlsx`;
    
    // Configurar os headers para download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${nomeArquivo}`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Enviar o arquivo para download
    res.send(excelBuffer);
    
  } catch (error) {
    console.error('Erro ao exportar condomínios para Excel:', error);
    req.flash('error', `Erro ao exportar condomínios para Excel: ${error.message}`);
    res.redirect('/condominios');
  }
};