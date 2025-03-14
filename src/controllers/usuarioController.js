// src/controllers/usuarioController.js
const Usuario = require('../models/usuario');
const Cliente = require('../models/cliente');
const Condominio = require('../models/condominio');
const bcrypt = require('bcryptjs');

// Listar todos os usuários
exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      include: [
        { association: 'condominio_usuario' },
        { association: 'cliente_usuario' }
      ],
      order: [['nome', 'ASC']]
    });
    
    res.render('usuarios/index', {
      title: 'Gestão de Usuários',
      usuarios,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    req.flash('error', 'Erro ao listar usuários');
    res.redirect('/');
  }
};

// Exibir formulário de cadastro
exports.exibirFormCadastro = async (req, res) => {
  try {
    console.log('Executando exibirFormCadastro de usuários');
    
    // Buscar todos os condomínios, sem filtro de status
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
    
    // Buscar condomínios ativos
    const condominiosAtivos = await Condominio.findAll({
      where: { status: 'Ativo' },
      order: [['nome', 'ASC']]
    });
    
    console.log(`Condomínios com status 'Ativo': ${condominiosAtivos.length}`);
    
    // Se não houver condomínios ativos, mas houver outros condomínios, usar todos
    const condominios = condominiosAtivos.length > 0 ? condominiosAtivos : todosCondominios;
    
    // Buscar clientes ativos
    const clientes = await Cliente.findAll({
      where: { status: 'Ativo' },
      include: [{ association: 'condominio_cliente' }],
      order: [['nome', 'ASC']]
    });
    
    // Adicionar mensagens orientativas
    if (todosCondominios.length === 0) {
      req.flash('warning', 'Não há condomínios cadastrados. Por favor, cadastre um condomínio primeiro.');
    } else if (condominiosAtivos.length === 0) {
      req.flash('warning', 'Não há condomínios ativos. Usando todos os condomínios disponíveis.');
    }
    
    res.render('usuarios/cadastro', {
      title: 'Cadastrar Usuário',
      usuario: {},
      condominios,
      clientes,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de cadastro:', error);
    console.error('Detalhes do erro:', error.stack);
    req.flash('error', 'Erro ao carregar formulário de cadastro');
    res.redirect('/usuarios');
  }
};

// Cadastrar novo usuário
exports.cadastrarUsuario = async (req, res) => {
  try {
    const {
      nome,
      email,
      senha,
      nivel,
      condominio_id,
      cliente_id
    } = req.body;

    // Verificar se o email já está em uso
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      req.flash('error', 'Email já cadastrado');
      return res.redirect('/usuarios/cadastro');
    }

    // Validar dados conforme o nível
    if (nivel === 'Sindico' && !condominio_id) {
      req.flash('error', 'Síndico deve estar vinculado a um condomínio');
      return res.redirect('/usuarios/cadastro');
    }

    if (nivel === 'Cliente' && !cliente_id) {
      req.flash('error', 'Cliente deve estar vinculado a um morador');
      return res.redirect('/usuarios/cadastro');
    }

    // Criar usuário
    await Usuario.create({
      nome,
      email,
      senha,
      nivel,
      condominio_id: condominio_id || null,
      cliente_id: cliente_id || null,
      ativo: true
    });

    req.flash('success', 'Usuário cadastrado com sucesso!');
    res.redirect('/usuarios');
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    req.flash('error', 'Erro ao cadastrar usuário');
    res.redirect('/usuarios/cadastro');
  }
};

// Exibir formulário de edição
exports.exibirFormEdicao = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id, {
      include: [
        { association: 'condominio_usuario' },
        { association: 'cliente_usuario' }
      ]
    });

    if (!usuario) {
      req.flash('error', 'Usuário não encontrado');
      return res.redirect('/usuarios');
    }

    // Buscar todos os condomínios, sem filtro de status
    const todosCondominios = await Condominio.findAll({
      order: [['nome', 'ASC']]
    });
    
    // Buscar condomínios ativos
    const condominiosAtivos = await Condominio.findAll({
      where: { status: 'Ativo' },
      order: [['nome', 'ASC']]
    });
    
    // Se não houver condomínios ativos, mas houver outros condomínios, usar todos
    const condominios = condominiosAtivos.length > 0 ? condominiosAtivos : todosCondominios;
    
    const clientes = await Cliente.findAll({
      where: { status: 'Ativo' },
      include: [{ association: 'condominio_cliente' }],
      order: [['nome', 'ASC']]
    });

    res.render('usuarios/editar', {
      title: 'Editar Usuário',
      usuario,
      condominios,
      clientes,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de edição:', error);
    req.flash('error', 'Erro ao carregar dados do usuário');
    res.redirect('/usuarios');
  }
};

// Atualizar usuário
exports.atualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      email,
      senha,
      nivel,
      condominio_id,
      cliente_id
    } = req.body;

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      req.flash('error', 'Usuário não encontrado');
      return res.redirect('/usuarios');
    }

    // Verificar se o email já está em uso por outro usuário
    if (email !== usuario.email) {
      const emailExistente = await Usuario.findOne({ where: { email } });
      if (emailExistente) {
        req.flash('error', 'Email já está em uso por outro usuário');
        return res.redirect(`/usuarios/editar/${id}`);
      }
    }

    // Validar dados conforme o nível
    if (nivel === 'Sindico' && !condominio_id) {
      req.flash('error', 'Síndico deve estar vinculado a um condomínio');
      return res.redirect(`/usuarios/editar/${id}`);
    }

    if (nivel === 'Cliente' && !cliente_id) {
      req.flash('error', 'Cliente deve estar vinculado a um morador');
      return res.redirect(`/usuarios/editar/${id}`);
    }

    // Atualizar dados
    const updateData = {
      nome,
      email,
      nivel,
      condominio_id: condominio_id || null,
      cliente_id: cliente_id || null
    };

    // Só atualizar a senha se fornecida
    if (senha && senha.trim() !== '') {
      updateData.senha = senha;
    }

    await usuario.update(updateData);

    req.flash('success', 'Usuário atualizado com sucesso!');
    res.redirect('/usuarios');
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    req.flash('error', 'Erro ao atualizar usuário');
    res.redirect(`/usuarios/editar/${req.params.id}`);
  }
};

// Excluir usuário
exports.excluirUsuario = async (req, res) => {
  console.log('========== FUNÇÃO EXCLUIR USUÁRIO ==========');
  console.log('Método da requisição:', req.method);
  console.log('URL completa:', req.originalUrl);
  console.log('Parâmetros:', req.params);
  console.log('Usuário logado:', req.user ? `ID: ${req.user.id}, Email: ${req.user.email}` : 'Não definido');
  console.log('req.usuario definido:', !!req.usuario);
  
  try {
    const { id } = req.params;
    console.log('ID do usuário a ser excluído:', id);
    
    // Não permitir excluir o próprio usuário
    if (parseInt(id) === req.user.id) { // Usando req.user
      console.log('Tentativa de excluir o próprio usuário. Negado.');
      req.flash('error', 'Não é possível excluir seu próprio usuário');
      return res.redirect('/usuarios');
    }

    const usuario = await Usuario.findByPk(id);
    console.log('Usuário encontrado:', usuario ? 'Sim' : 'Não');

    if (!usuario) {
      console.log('Usuário não encontrado, redirecionando');
      req.flash('error', 'Usuário não encontrado');
      return res.redirect('/usuarios');
    }

    console.log('Excluindo usuário...');
    await usuario.destroy();
    console.log('Usuário excluído com sucesso');
    
    req.flash('success', 'Usuário excluído com sucesso!');
    res.redirect('/usuarios');
  } catch (error) {
    console.error('ERRO ao excluir usuário:', error);
    req.flash('error', 'Erro ao excluir usuário');
    res.redirect('/usuarios');
  }
};

// Alternar status (ativar/desativar)
exports.alternarStatus = async (req, res) => {
  console.log('========== FUNÇÃO ALTERNAR STATUS ==========');
  console.log('Método da requisição:', req.method);
  console.log('URL completa:', req.originalUrl);
  console.log('Parâmetros:', req.params);
  console.log('Usuário logado:', req.user ? `ID: ${req.user.id}, Email: ${req.user.email}` : 'Não definido');
  console.log('req.usuario definido:', !!req.usuario);
  
  try {
    const { id } = req.params;
    console.log('ID do usuário para alternar status:', id);
    
    // Não permitir desativar o próprio usuário
    if (parseInt(id) === req.user.id) { // Usando req.user
      console.log('Tentativa de alternar status do próprio usuário. Negado.');
      req.flash('error', 'Não é possível desativar seu próprio usuário');
      return res.redirect('/usuarios');
    }

    const usuario = await Usuario.findByPk(id);
    console.log('Usuário encontrado:', usuario ? 'Sim' : 'Não');

    if (!usuario) {
      console.log('Usuário não encontrado, redirecionando');
      req.flash('error', 'Usuário não encontrado');
      return res.redirect('/usuarios');
    }

    // Alternar o status
    usuario.ativo = !usuario.ativo;
    console.log(`Alterando status de ${usuario.ativo ? 'Inativo' : 'Ativo'} para ${usuario.ativo ? 'Ativo' : 'Inativo'}`);
    
    await usuario.save();
    console.log('Status alterado com sucesso');

    req.flash('success', `Usuário ${usuario.ativo ? 'ativado' : 'desativado'} com sucesso!`);
    res.redirect('/usuarios');
  } catch (error) {
    console.error('ERRO ao alternar status do usuário:', error);
    req.flash('error', 'Erro ao alternar status do usuário');
    res.redirect('/usuarios');
  }
};