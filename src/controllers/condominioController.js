const Condominio = require('../models/condominio');

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