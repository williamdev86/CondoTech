const Cliente = require('../models/cliente');
const Condominio = require('../models/condominio');
const Chamado = require('../models/chamado');
const Usuario = require('../models/usuario');

// Listar todos os clientes
exports.listarClientes = async (req, res) => {
  try {
    console.log('Executando listarClientes');
    const clientes = await Cliente.findAll({
      include: [{
        model: Condominio,
        as: 'condominio_cliente'
      }],
      order: [['nome', 'ASC']]
    });
    
    console.log(`Encontrados ${clientes.length} clientes`);
    
    res.render('clientes/index', {
      title: 'Clientes',
      clientes,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    req.flash('error', 'Erro ao listar clientes');
    res.redirect('/');
  }
};

// Renderizar formulário de cadastro
exports.exibirFormCadastro = async (req, res) => {
  try {
    console.log('Executando exibirFormCadastro');
    
    // Primeiro, verificamos todos os condomínios, sem filtro de status
    const todosCondominios = await Condominio.findAll({
      order: [['nome', 'ASC']]
    });
    
    console.log(`Total de condomínios encontrados: ${todosCondominios.length}`);
    if (todosCondominios.length > 0) {
      console.log('Status dos condomínios encontrados:');
      todosCondominios.forEach(cond => {
        console.log(`ID: ${cond.id} | Nome: ${cond.nome} | Status: ${cond.status}`);
      });
    }
    
    // Depois filtramos apenas os ativos
    const condominiosAtivos = await Condominio.findAll({
      where: { status: 'Ativo' },
      order: [['nome', 'ASC']]
    });
    
    console.log(`Condomínios com status 'Ativo': ${condominiosAtivos.length}`);
    
    // Se não houver condomínios ativos, mas houver outros condomínios, usar todos
    const condominios = condominiosAtivos.length > 0 ? condominiosAtivos : todosCondominios;
    
    // Adicionar mensagens orientativas
    if (todosCondominios.length === 0) {
      req.flash('warning', 'Não há condomínios cadastrados. Por favor, cadastre um condomínio primeiro.');
    } else if (condominiosAtivos.length === 0) {
      req.flash('warning', 'Não há condomínios ativos. Por favor, ative pelo menos um condomínio.');
    }
    
    res.render('clientes/cadastro', {
      title: 'Cadastrar Cliente',
      cliente: {},
      condominios,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao carregar formulário de cadastro:', error);
    console.error('Detalhes do erro:', error.stack);
    req.flash('error', 'Erro ao carregar formulário de cadastro');
    res.redirect('/clientes');
  }
};

// Cadastrar novo cliente
exports.cadastrarCliente = async (req, res) => {
  try {
    console.log('Executando cadastrarCliente');
    console.log('Dados do formulário recebidos:', req.body);
    
    const {
      nome,
      cpf,
      email,
      telefone,
      telefone2,
      nome_mae,
      data_nascimento,
      logradouro,
      numero,
      cep,
      bairro,
      cidade,
      plano_contratado,
      valor,
      consultor,
      bloco,
      apartamento,
      condominio_id,
      status
    } = req.body;
    
    // Tratar campos de data vazios
    const dataNascimentoFormatada = data_nascimento && data_nascimento.trim() !== '' 
      ? new Date(data_nascimento) 
      : null;
    
    // Tratar campos vazios para evitar valores incorretos
    const telefone2Formatado = telefone2 && telefone2.trim() !== '' ? telefone2 : null;
    const nome_maeFormatado = nome_mae && nome_mae.trim() !== '' ? nome_mae : null;
    const logradouroFormatado = logradouro && logradouro.trim() !== '' ? logradouro : null;
    const numeroFormatado = numero && numero.trim() !== '' ? numero : null;
    const cepFormatado = cep && cep.trim() !== '' ? cep : null;
    const bairroFormatado = bairro && bairro.trim() !== '' ? bairro : null;
    const cidadeFormatado = cidade && cidade.trim() !== '' ? cidade : null;
    const plano_contratadoFormatado = plano_contratado && plano_contratado.trim() !== '' ? plano_contratado : null;
    const valorFormatado = valor && valor.trim() !== '' ? parseFloat(valor) || null : null;
    const consultorFormatado = consultor && consultor.trim() !== '' ? consultor : null;
    
    console.log('Dados processados para criar cliente:', {
      nome, cpf, email, telefone, 
      telefone2: telefone2Formatado,
      nome_mae: nome_maeFormatado,
      data_nascimento: dataNascimentoFormatada,
      logradouro: logradouroFormatado,
      numero: numeroFormatado,
      cep: cepFormatado,
      bairro: bairroFormatado,
      cidade: cidadeFormatado,
      plano_contratado: plano_contratadoFormatado,
      valor: valorFormatado,
      consultor: consultorFormatado,
      bloco, apartamento, condominio_id, status
    });

    const novoCliente = await Cliente.create({
      nome,
      cpf,
      email,
      telefone,
      telefone2: telefone2Formatado,
      nome_mae: nome_maeFormatado,
      data_nascimento: dataNascimentoFormatada,
      logradouro: logradouroFormatado,
      numero: numeroFormatado,
      cep: cepFormatado,
      bairro: bairroFormatado,
      cidade: cidadeFormatado,
      plano_contratado: plano_contratadoFormatado,
      valor: valorFormatado,
      consultor: consultorFormatado,
      bloco,
      apartamento,
      condominio_id,
      status: status || 'Ativo'
    });

    console.log('Cliente criado com sucesso:', novoCliente.toJSON());

    req.flash('success', 'Cliente cadastrado com sucesso!');
    res.redirect('/clientes');
  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error);
    console.error('Detalhes do erro:', error.stack);
    req.flash('error', 'Erro ao cadastrar cliente');
    res.redirect('/clientes/cadastro');
  }
};

// Renderizar formulário de edição
exports.exibirFormEdicao = async (req, res) => {
  try {
    console.log('Executando exibirFormEdicao');
    const { id } = req.params;
    console.log('ID do cliente:', id);
    
    const cliente = await Cliente.findByPk(id);
    console.log('Cliente encontrado:', cliente ? 'Sim' : 'Não');
    
    if (cliente) {
      console.log('Dados do cliente:', cliente.toJSON());
    }
    
    const condominios = await Condominio.findAll({
      order: [['nome', 'ASC']]
    });
    
    console.log(`Encontrados ${condominios.length} condomínios`);

    if (!cliente) {
      req.flash('error', 'Cliente não encontrado');
      return res.redirect('/clientes');
    }

    res.render('clientes/editar', {
      title: 'Editar Cliente',
      cliente,
      condominios,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de edição:', error);
    console.error('Detalhes do erro:', error.stack);
    req.flash('error', 'Erro ao carregar dados do cliente');
    res.redirect('/clientes');
  }
};

// Atualizar cliente
exports.atualizarCliente = async (req, res) => {
  try {
    console.log('Executando atualizarCliente');
    const { id } = req.params;
    console.log('ID do cliente a ser atualizado:', id);
    console.log('Dados do formulário recebidos:', req.body);
    
    const {
      nome,
      cpf,
      email,
      telefone,
      telefone2,
      nome_mae,
      data_nascimento,
      logradouro,
      numero,
      cep,
      bairro,
      cidade,
      plano_contratado,
      valor,
      consultor,
      bloco,
      apartamento,
      condominio_id,
      status
    } = req.body;
    
    // Tratar campos de data vazios
    const dataNascimentoFormatada = data_nascimento && data_nascimento.trim() !== '' 
      ? new Date(data_nascimento) 
      : null;
    
    // Tratar campos vazios para evitar valores incorretos
    const telefone2Formatado = telefone2 && telefone2.trim() !== '' ? telefone2 : null;
    const nome_maeFormatado = nome_mae && nome_mae.trim() !== '' ? nome_mae : null;
    const logradouroFormatado = logradouro && logradouro.trim() !== '' ? logradouro : null;
    const numeroFormatado = numero && numero.trim() !== '' ? numero : null;
    const cepFormatado = cep && cep.trim() !== '' ? cep : null;
    const bairroFormatado = bairro && bairro.trim() !== '' ? bairro : null;
    const cidadeFormatado = cidade && cidade.trim() !== '' ? cidade : null;
    const plano_contratadoFormatado = plano_contratado && plano_contratado.trim() !== '' ? plano_contratado : null;
    const valorFormatado = valor && valor.trim() !== '' ? parseFloat(valor) || null : null;
    const consultorFormatado = consultor && consultor.trim() !== '' ? consultor : null;
    
    console.log('Dados processados para atualizar cliente:', {
      nome, cpf, email, telefone, 
      telefone2: telefone2Formatado,
      nome_mae: nome_maeFormatado,
      data_nascimento: dataNascimentoFormatada,
      logradouro: logradouroFormatado,
      numero: numeroFormatado,
      cep: cepFormatado,
      bairro: bairroFormatado,
      cidade: cidadeFormatado,
      plano_contratado: plano_contratadoFormatado,
      valor: valorFormatado,
      consultor: consultorFormatado,
      bloco, apartamento, condominio_id, status
    });

    const cliente = await Cliente.findByPk(id);
    console.log('Cliente encontrado:', cliente ? 'Sim' : 'Não');
    
    if (cliente) {
      console.log('Cliente antes da atualização:', cliente.toJSON());
    }

    if (!cliente) {
      req.flash('error', 'Cliente não encontrado');
      return res.redirect('/clientes');
    }

    await cliente.update({
      nome,
      cpf,
      email,
      telefone,
      telefone2: telefone2Formatado,
      nome_mae: nome_maeFormatado,
      data_nascimento: dataNascimentoFormatada,
      logradouro: logradouroFormatado,
      numero: numeroFormatado,
      cep: cepFormatado,
      bairro: bairroFormatado,
      cidade: cidadeFormatado,
      plano_contratado: plano_contratadoFormatado,
      valor: valorFormatado,
      consultor: consultorFormatado,
      bloco,
      apartamento,
      condominio_id,
      status
    });

    // Buscar o cliente atualizado para verificar os dados
    const clienteAtualizado = await Cliente.findByPk(id);
    console.log('Cliente após atualização:', clienteAtualizado.toJSON());

    req.flash('success', 'Cliente atualizado com sucesso!');
    res.redirect('/clientes');
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    console.error('Detalhes do erro:', error.stack);
    req.flash('error', 'Erro ao atualizar cliente');
    res.redirect(`/clientes/editar/${req.params.id}`);
  }
};

// Excluir cliente
exports.excluirCliente = async (req, res) => {
  try {
    console.log('Executando excluirCliente');
    const { id } = req.params;
    console.log('ID do cliente a ser excluído:', id);
    
    const cliente = await Cliente.findByPk(id);
    console.log('Cliente encontrado:', cliente ? 'Sim' : 'Não');
    
    if (cliente) {
      console.log('Dados do cliente a ser excluído:', cliente.toJSON());
    }

    if (!cliente) {
      req.flash('error', 'Cliente não encontrado');
      return res.redirect('/clientes');
    }

    // Verificar se existem chamados associados a este cliente
    const chamadosCount = await Chamado.count({ where: { cliente_id: id } });
    
    if (chamadosCount > 0) {
      req.flash('error', `Não é possível excluir o cliente. Existem ${chamadosCount} chamados vinculados a este cliente.`);
      return res.redirect('/clientes');
    }

    // Verificar se existem usuários associados a este cliente
    const usuariosCount = await Usuario.count({ where: { cliente_id: id } });
    
    if (usuariosCount > 0) {
      req.flash('error', `Não é possível excluir o cliente. Existem ${usuariosCount} usuários vinculados a este cliente.`);
      return res.redirect('/clientes');
    }

    await cliente.destroy();
    console.log('Cliente excluído com sucesso');
    
    req.flash('success', 'Cliente excluído com sucesso!');
    res.redirect('/clientes');
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    console.error('Detalhes do erro:', error.stack);
    req.flash('error', 'Erro ao excluir cliente. Verifique se não há chamados ou usuários vinculados.');
    res.redirect('/clientes');
  }
};

// Buscar clientes por condomínio
exports.buscarPorCondominio = async (req, res) => {
  try {
    console.log('Executando buscarPorCondominio');
    const { condominioId } = req.params;
    console.log('ID do condomínio:', condominioId);
    
    const clientes = await Cliente.findAll({
      where: { condominio_id: condominioId, status: 'Ativo' },
      order: [['nome', 'ASC']]
    });
    
    console.log(`Encontrados ${clientes.length} clientes para o condomínio ${condominioId}`);

    res.json(clientes);
  } catch (error) {
    console.error('Erro ao buscar clientes por condomínio:', error);
    console.error('Detalhes do erro:', error.stack);
    res.status(500).json({ message: 'Erro ao buscar clientes' });
  }
};

// Função para exportar clientes para Excel
exports.exportarExcel = async (req, res) => {
  try {
    // Importar Op do Sequelize para operações complexas de busca
    const { Op } = require('sequelize');
    const XLSX = require('xlsx');
    
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
        { cpf: { [Op.like]: `%${textoBusca}%` } },
        { email: { [Op.like]: `%${textoBusca}%` } },
        { telefone: { [Op.like]: `%${textoBusca}%` } },
        { bloco: { [Op.like]: `%${textoBusca}%` } },
        { apartamento: { [Op.like]: `%${textoBusca}%` } }
      ];
    }
    
    // Buscar clientes com os filtros aplicados
    const clientes = await Cliente.findAll({
      where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
      include: [{
        model: Condominio,
        as: 'condominio_cliente'
      }],
      order: [['nome', 'ASC']]
    });
    
    if (!clientes || clientes.length === 0) {
      req.flash('error', 'Não há clientes para exportar com os filtros aplicados');
      return res.redirect('/clientes');
    }
    
    // Transformar os dados para o formato adequado para o Excel
    const dadosParaExcel = clientes.map(cliente => {
      // Retornar apenas os dados desejados, sem metadados do Sequelize
      return {
        'ID': cliente.id,
        'Nome': cliente.nome,
        'CPF': cliente.cpf,
        'Email': cliente.email,
        'Telefone': cliente.telefone,
        'Telefone 2': cliente.telefone2 || '',
        'Nome da Mãe': cliente.nome_mae || '',
        'Data de Nascimento': cliente.data_nascimento ? new Date(cliente.data_nascimento).toLocaleDateString('pt-BR') : '',
        'Endereço': cliente.logradouro || '',
        'Número': cliente.numero || '',
        'CEP': cliente.cep || '',
        'Cidade': cliente.cidade || '',
        'Condomínio': cliente.condominio_cliente ? cliente.condominio_cliente.nome : '',
        'Bloco': cliente.bloco,
        'Apartamento': cliente.apartamento,
        'Plano Contratado': cliente.plano_contratado || '',
        'Valor': cliente.valor || '',
        'Consultor': cliente.consultor || '',
        'Status': cliente.status,
        'Data de Cadastro': cliente.createdAt ? new Date(cliente.createdAt).toLocaleString('pt-BR') : '',
        'Última Atualização': cliente.updatedAt ? new Date(cliente.updatedAt).toLocaleString('pt-BR') : ''
      };
    });
    
    // Criar uma planilha com os dados
    const ws = XLSX.utils.json_to_sheet(dadosParaExcel);
    
    // Configurar a largura das colunas
    const wscols = [
      {wch: 5},  // ID
      {wch: 30}, // Nome
      {wch: 15}, // CPF
      {wch: 25}, // Email
      {wch: 15}, // Telefone
      {wch: 15}, // Telefone 2
      {wch: 30}, // Nome da Mãe
      {wch: 15}, // Data de Nascimento
      {wch: 30}, // Endereço
      {wch: 10}, // Número
      {wch: 10}, // CEP
      {wch: 15}, // Cidade
      {wch: 25}, // Condomínio
      {wch: 10}, // Bloco
      {wch: 10}, // Apartamento
      {wch: 20}, // Plano Contratado
      {wch: 10}, // Valor
      {wch: 20}, // Consultor
      {wch: 10}, // Status
      {wch: 20}, // Data de Cadastro
      {wch: 20}  // Última Atualização
    ];
    ws['!cols'] = wscols;
    
    // Criar um novo workbook e adicionar a planilha
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    
    // Adicionar informações sobre os filtros aplicados em uma nova planilha
    const filtrosWs = XLSX.utils.aoa_to_sheet([
      ['Filtros Aplicados'],
      ['Data de exportação', new Date().toLocaleString('pt-BR')],
      ['Status', status || 'Todos'],
      ['Termo de busca', busca || 'Nenhum'],
      ['Total de registros', clientes.length.toString()]
    ]);
    
    XLSX.utils.book_append_sheet(wb, filtrosWs, 'Informações');
    
    // Gerar o buffer do arquivo Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    // Definir o nome do arquivo com a data atual
    const dataAtual = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const statusSufixo = status && status !== 'todos' ? `_${status}` : '';
    const nomeArquivo = `clientes${statusSufixo}_${dataAtual}.xlsx`;
    
    // Configurar os headers para download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${nomeArquivo}`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Enviar o arquivo para download
    res.send(excelBuffer);
    
  } catch (error) {
    console.error('Erro ao exportar clientes para Excel:', error);
    req.flash('error', `Erro ao exportar clientes para Excel: ${error.message}`);
    res.redirect('/clientes');
  }
};

// Exibir formulário de importação
exports.exibirFormImportacao = async (req, res) => {
  try {
    // Buscar condomínios para o select do formulário
    const condominios = await Condominio.findAll({
      where: { status: 'Ativo' },
      order: [['nome', 'ASC']]
    });
    
    res.render('clientes/importar', {
      title: 'Importar Clientes',
      condominios,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de importação:', error);
    req.flash('error', `Erro ao carregar formulário de importação: ${error.message}`);
    res.redirect('/clientes');
  }
};

// Processar arquivo de importação
exports.processarImportacao = async (req, res) => {
  try {
    const XLSX = require('xlsx');
    
    // Verificar se o arquivo foi enviado
    if (!req.file) {
      req.flash('error', 'Nenhum arquivo foi enviado');
      return res.redirect('/clientes/importar');
    }

    // Ler o arquivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      req.flash('error', 'A planilha não contém dados');
      return res.redirect('/clientes/importar');
    }

    // Obter valores padrão do formulário
    const {
      condominio_id,
      status_padrao,
      bloco_padrao,
      apartamento_padrao
    } = req.body;
    
    // Buscar o condomínio selecionado para associar aos clientes
    const condominio = await Condominio.findByPk(condominio_id);
    if (!condominio) {
      req.flash('error', 'Condomínio não encontrado. Selecione um condomínio válido.');
      return res.redirect('/clientes/importar');
    }

    // Mapear os dados da planilha para o formato do modelo
    const clientesPreview = data.map(row => {
      // Tentar encontrar as colunas com diferentes possíveis nomes
      const nome = row['Nome'] || row['NOME'] || row['nome'] || '';
      const cpf = row['CPF'] || row['cpf'] || '';
      const email = row['Email'] || row['EMAIL'] || row['email'] || '';
      const telefone = row['Telefone'] || row['TELEFONE'] || row['telefone'] || '';
      const telefone2 = row['Telefone2'] || row['Telefone 2'] || row['TELEFONE2'] || row['telefone2'] || null;
      const nome_mae = row['Nome da Mãe'] || row['NOME_MAE'] || row['nome_mae'] || null;
      
      // Verificar se há um bloco e apartamento na planilha, ou usar valores padrão
      const bloco = row['Bloco'] || row['BLOCO'] || row['bloco'] || bloco_padrao;
      const apartamento = row['Apartamento'] || row['APARTAMENTO'] || row['apartamento'] || row['Apto'] || row['APTO'] || row['apto'] || apartamento_padrao;
      
      // Dados adicionais opcionais
      const data_nascimento = row['Data de Nascimento'] || row['DATA_NASCIMENTO'] || row['data_nascimento'] || null;
      const logradouro = row['Endereço'] || row['ENDERECO'] || row['endereco'] || row['Logradouro'] || row['LOGRADOURO'] || null;
      const numero = row['Número'] || row['NUMERO'] || row['numero'] || null;
      const cep = row['CEP'] || row['cep'] || null;
      const cidade = row['Cidade'] || row['CIDADE'] || row['cidade'] || null;
      const plano_contratado = row['Plano'] || row['PLANO'] || row['plano_contratado'] || row['Plano Contratado'] || null;
      const valor = row['Valor'] || row['VALOR'] || row['valor'] || null;
      const consultor = row['Consultor'] || row['CONSULTOR'] || row['consultor'] || null;
      
      // Status padrão se não for fornecido
      const status = row['Status'] || row['STATUS'] || row['status'] || status_padrao;
      
      return {
        nome,
        cpf,
        email,
        telefone,
        telefone2,
        nome_mae,
        data_nascimento,
        logradouro,
        numero,
        cep,
        cidade,
        plano_contratado,
        valor,
        consultor,
        bloco,
        apartamento,
        condominio_id,
        status
      };
    });

    // Validar dados básicos
    const dadosValidos = clientesPreview.filter(item => 
      item.nome && item.cpf && item.email && item.telefone && item.bloco && item.apartamento
    );

    if (dadosValidos.length === 0) {
      req.flash('error', 'Nenhum dado válido foi encontrado na planilha. Verifique se as colunas estão nomeadas corretamente.');
      return res.redirect('/clientes/importar');
    }

    // Renderizar a página com a pré-visualização dos dados
    res.render('clientes/importar', {
      title: 'Pré-visualização da Importação',
      preview: dadosValidos,
      condominio: condominio,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao processar arquivo de importação:', error);
    req.flash('error', `Erro ao processar arquivo: ${error.message}`);
    res.redirect('/clientes/importar');
  }
};

// Confirmar e salvar os dados de importação
exports.confirmarImportacao = async (req, res) => {
  try {
    // Obter dados do formulário
    const { dados } = req.body;
    let clientesList = [];
    
    try {
      clientesList = JSON.parse(dados);
    } catch (e) {
      req.flash('error', 'Erro ao processar os dados de importação');
      return res.redirect('/clientes/importar');
    }

    // Resultados da importação
    const resultados = {
      importados: 0,
      erros: []
    };

    // Salvar cada cliente
    for (const cliente of clientesList) {
      try {
        // Verificar se já existe um cliente com o mesmo CPF
        const existente = await Cliente.findOne({ 
          where: { cpf: cliente.cpf } 
        });
        
        if (existente) {
          resultados.erros.push(`Cliente com CPF "${cliente.cpf}" já existe no banco de dados`);
          continue;
        }
        
        // Converter campos de data
        let dataNascimento = null;
        if (cliente.data_nascimento) {
          // Tentar converter diferentes formatos de data
          try {
            dataNascimento = new Date(cliente.data_nascimento);
            if (isNaN(dataNascimento.getTime())) dataNascimento = null;
          } catch (e) {
            dataNascimento = null;
          }
        }
        
        // Converter valor para número se for texto
        let valorFormatado = null;
        if (cliente.valor) {
          if (typeof cliente.valor === 'string') {
            // Remover símbolos e converter para número
            valorFormatado = parseFloat(cliente.valor.replace(/[^\d.,]/g, '').replace(',', '.')) || null;
          } else {
            valorFormatado = cliente.valor;
          }
        }
        
        await Cliente.create({
          nome: cliente.nome,
          cpf: cliente.cpf,
          email: cliente.email,
          telefone: cliente.telefone,
          telefone2: cliente.telefone2,
          nome_mae: cliente.nome_mae,
          data_nascimento: dataNascimento,
          logradouro: cliente.logradouro,
          numero: cliente.numero,
          cep: cliente.cep,
          cidade: cliente.cidade,
          plano_contratado: cliente.plano_contratado,
          valor: valorFormatado,
          consultor: cliente.consultor,
          bloco: cliente.bloco,
          apartamento: cliente.apartamento,
          condominio_id: cliente.condominio_id,
          status: cliente.status || 'Ativo'
        });
        
        resultados.importados++;
      } catch (error) {
        resultados.erros.push(`Erro ao importar ${cliente.nome}: ${error.message}`);
      }
    }

    // Renderizar resultados
    res.render('clientes/importar', {
      title: 'Resultados da Importação',
      resultados,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro na confirmação da importação:', error);
    req.flash('error', `Erro ao importar clientes: ${error.message}`);
    res.redirect('/clientes/importar');
  }
};