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