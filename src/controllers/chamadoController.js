const Chamado = require('../models/chamado');
const Cliente = require('../models/cliente');
const Condominio = require('../models/condominio');
const { Op } = require('sequelize');

// Listar chamados - filtrados de acordo com o nível de acesso do usuário
exports.listarChamados = async (req, res) => {
  try {
    let chamados;
    const usuario = req.user; // Usuário logado, fornecido pelo middleware de autenticação

    // Diferentes consultas baseadas no nível do usuário
    if (usuario.nivel === 'Admin') {
      // Admin vê todos os chamados
      chamados = await Chamado.findAll({
        include: [{
          model: Cliente,
          as: 'cliente_chamado',
          include: [{
            model: Condominio,
            as: 'condominio_cliente'
          }]
        }],
        order: [['data_abertura', 'DESC']]
      });
    } else if (usuario.nivel === 'Sindico') {
      // Síndico vê apenas chamados do seu condomínio
      chamados = await Chamado.findAll({
        include: [{
          model: Cliente,
          as: 'cliente_chamado',
          where: { condominio_id: usuario.condominio_id },
          include: [{
            model: Condominio,
            as: 'condominio_cliente'
          }]
        }],
        order: [['data_abertura', 'DESC']]
      });
    } else {
      // Cliente vê apenas seus próprios chamados
      chamados = await Chamado.findAll({
        where: { cliente_id: usuario.cliente_id },
        include: [{
          model: Cliente,
          as: 'cliente_chamado',
          include: [{
            model: Condominio,
            as: 'condominio_cliente'
          }]
        }],
        order: [['data_abertura', 'DESC']]
      });
    }
    
    res.render('chamados/index', {
      title: 'Chamados',
      chamados,
      usuario, // Passando o usuário para a view
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao listar chamados:', error);
    req.flash('error', 'Erro ao listar chamados');
    res.redirect('/');
  }
};

// Renderizar formulário de cadastro
exports.exibirFormCadastro = async (req, res) => {
  try {
    const usuario = req.user;
    let condominios = [];
    let clientes = [];

    if (usuario.nivel === 'Admin') {
      // Admin pode selecionar qualquer condomínio
      // Primeiro buscar todos os condomínios
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
      
      // Depois busca apenas os ativos
      const condominiosAtivos = await Condominio.findAll({
        where: { status: 'Ativo' },
        order: [['nome', 'ASC']]
      });
      
      console.log(`Condomínios com status 'Ativo': ${condominiosAtivos.length}`);
      
      // Se não houver ativos, usa todos
      condominios = condominiosAtivos.length > 0 ? condominiosAtivos : todosCondominios;
      
      // Adicionar mensagens informativas
      if (todosCondominios.length === 0) {
        req.flash('warning', 'Não há condomínios cadastrados. Por favor, cadastre um condomínio primeiro.');
      } else if (condominiosAtivos.length === 0) {
        req.flash('warning', 'Não há condomínios ativos. Por favor, ative pelo menos um condomínio.');
      }
    } else if (usuario.nivel === 'Sindico') {
      // Síndico só pode ver seu próprio condomínio
      condominios = await Condominio.findAll({
        where: { id: usuario.condominio_id },
      });
      
      // Carregar clientes do condomínio do síndico
      clientes = await Cliente.findAll({
        where: { condominio_id: usuario.condominio_id, status: 'Ativo' },
        order: [['nome', 'ASC']]
      });
    } else {
      // Cliente só pode abrir chamados para si mesmo
      // Não precisa de lista de condomínios, mas precisa do seu próprio condomínio para exibição
      const cliente = await Cliente.findByPk(usuario.cliente_id, {
        include: [{ model: Condominio, as: 'condominio_cliente' }]
      });
      
      if (cliente && cliente.condominio_cliente) {
        condominios = [cliente.condominio_cliente];
        clientes = [cliente];
      }
    }
    
    res.render('chamados/cadastro', {
      title: 'Abrir Chamado',
      chamado: {},
      condominios,
      clientes,
      usuario,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao carregar formulário de cadastro:', error);
    console.error('Detalhes do erro:', error.stack);
    req.flash('error', 'Erro ao carregar formulário de cadastro');
    res.redirect('/chamados');
  }
};

// Cadastrar novo chamado
exports.cadastrarChamado = async (req, res) => {
  try {
    const usuario = req.user;
    const {
      cliente_id,
      tipo,
      descricao,
      prioridade
    } = req.body;

    // Verificar permissões
    if (usuario.nivel === 'Cliente') {
      // Cliente só pode criar chamados para si mesmo
      if (parseInt(cliente_id) !== usuario.cliente_id) {
        req.flash('error', 'Você só pode abrir chamados para sua própria conta');
        return res.redirect('/chamados/cadastro');
      }
    } else if (usuario.nivel === 'Sindico') {
      // Verificar se o cliente pertence ao condomínio do síndico
      const cliente = await Cliente.findByPk(cliente_id);
      if (!cliente || cliente.condominio_id !== usuario.condominio_id) {
        req.flash('error', 'Você só pode abrir chamados para clientes do seu condomínio');
        return res.redirect('/chamados/cadastro');
      }
    }

    await Chamado.create({
      cliente_id,
      tipo,
      descricao,
      prioridade,
      status: 'Aberto',
      data_abertura: new Date(),
      aberto_por: usuario.id // Registrar quem abriu o chamado
    });

    req.flash('success', 'Chamado aberto com sucesso!');
    res.redirect('/chamados');
  } catch (error) {
    console.error('Erro ao cadastrar chamado:', error);
    req.flash('error', 'Erro ao abrir chamado');
    res.redirect('/chamados/cadastro');
  }
};

// Renderizar formulário de edição
exports.exibirFormEdicao = async (req, res) => {
  try {
    const usuario = req.user;
    const { id } = req.params;
    
    // Buscar o chamado
    const chamado = await Chamado.findByPk(id, {
      include: [{
        model: Cliente,
        as: 'cliente_chamado',
        include: [{
          model: Condominio,
          as: 'condominio_cliente'
        }]
      }]
    });

    if (!chamado) {
      req.flash('error', 'Chamado não encontrado');
      return res.redirect('/chamados');
    }

    // Verificar permissões
    if (usuario.nivel === 'Cliente') {
      // Cliente só pode editar seus próprios chamados
      if (chamado.cliente_id !== usuario.cliente_id) {
        req.flash('error', 'Você não tem permissão para editar este chamado');
        return res.redirect('/chamados');
      }
    } else if (usuario.nivel === 'Sindico') {
      // Síndico só pode editar chamados de seu condomínio
      if (chamado.cliente_chamado.condominio_id !== usuario.condominio_id) {
        req.flash('error', 'Você não tem permissão para editar este chamado');
        return res.redirect('/chamados');
      }
    }

    // Buscar clientes e condomínios conforme o nível de acesso
    let clientes = [];
    let condominios = [];

    if (usuario.nivel === 'Admin') {
      // Admin pode selecionar qualquer condomínio/cliente
      // Primeiro buscar todos
      const todosCondominios = await Condominio.findAll({
        order: [['nome', 'ASC']]
      });
      
      // Depois filtrar os ativos
      const condominiosAtivos = await Condominio.findAll({
        where: { status: 'Ativo' },
        order: [['nome', 'ASC']]
      });
      
      // Se não houver ativos, usar todos
      condominios = condominiosAtivos.length > 0 ? condominiosAtivos : todosCondominios;
      
      // Buscar clientes do condomínio do chamado
      clientes = await Cliente.findAll({
        where: { 
          condominio_id: chamado.cliente_chamado.condominio_id, 
          status: 'Ativo' 
        },
        order: [['nome', 'ASC']]
      });
    } else if (usuario.nivel === 'Sindico') {
      // Síndico só pode ver seu próprio condomínio
      condominios = await Condominio.findAll({
        where: { id: usuario.condominio_id }
      });
      
      // Buscar clientes do condomínio do síndico
      clientes = await Cliente.findAll({
        where: { 
          condominio_id: usuario.condominio_id, 
          status: 'Ativo' 
        },
        order: [['nome', 'ASC']]
      });
    } else {
      // Cliente só pode ver a si mesmo
      const cliente = await Cliente.findByPk(usuario.cliente_id, {
        include: [{ model: Condominio, as: 'condominio_cliente' }]
      });
      
      if (cliente && cliente.condominio_cliente) {
        condominios = [cliente.condominio_cliente];
        clientes = [cliente];
      }
    }

    res.render('chamados/editar', {
      title: 'Editar Chamado',
      chamado,
      clientes,
      condominios,
      usuario,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de edição:', error);
    req.flash('error', 'Erro ao carregar dados do chamado');
    res.redirect('/chamados');
  }
};

// Atualizar chamado
exports.atualizarChamado = async (req, res) => {
  try {
    const usuario = req.user;
    const { id } = req.params;
    const {
      cliente_id,
      tipo,
      descricao,
      prioridade,
      status,
      tecnico_responsavel,
      solucao
    } = req.body;

    // Buscar o chamado
    const chamado = await Chamado.findByPk(id, {
      include: [{
        model: Cliente,
        as: 'cliente_chamado'
      }]
    });

    if (!chamado) {
      req.flash('error', 'Chamado não encontrado');
      return res.redirect('/chamados');
    }

    // Verificar permissões
    if (usuario.nivel === 'Cliente') {
      // Cliente só pode editar seus próprios chamados e não pode mudar o status para resolvido/cancelado
      if (chamado.cliente_id !== usuario.cliente_id) {
        req.flash('error', 'Você não tem permissão para editar este chamado');
        return res.redirect('/chamados');
      }
      
      // Cliente não pode mudar para status avançados
      if (status === 'Resolvido' || status === 'Cancelado') {
        req.flash('error', 'Você não tem permissão para resolver ou cancelar chamados');
        return res.redirect(`/chamados/editar/${id}`);
      }
      
      // Cliente não pode mudar o cliente associado ao chamado
      if (parseInt(cliente_id) !== chamado.cliente_id) {
        req.flash('error', 'Você não pode transferir o chamado para outro cliente');
        return res.redirect(`/chamados/editar/${id}`);
      }
    } else if (usuario.nivel === 'Sindico') {
      // Síndico só pode editar chamados de seu condomínio
      if (chamado.cliente_chamado.condominio_id !== usuario.condominio_id) {
        req.flash('error', 'Você não tem permissão para editar este chamado');
        return res.redirect('/chamados');
      }
      
      // Sindico só pode transferir para clientes do mesmo condomínio
      if (parseInt(cliente_id) !== chamado.cliente_id) {
        const novoCliente = await Cliente.findByPk(cliente_id);
        if (!novoCliente || novoCliente.condominio_id !== usuario.condominio_id) {
          req.flash('error', 'Você só pode transferir o chamado para clientes do seu condomínio');
          return res.redirect(`/chamados/editar/${id}`);
        }
      }
    }

    const updateData = {
      tipo,
      descricao,
      prioridade,
      status,
      solucao
    };
    
    // Admin pode mudar o cliente
    if (usuario.nivel === 'Admin' || usuario.nivel === 'Sindico') {
      updateData.cliente_id = cliente_id;
      updateData.tecnico_responsavel = tecnico_responsavel;
    }

    // Se o status for "Resolvido" ou "Cancelado" e o chamado não tem data_fechamento
    if ((status === 'Resolvido' || status === 'Cancelado') && !chamado.data_fechamento) {
      updateData.data_fechamento = new Date();
      updateData.fechado_por = usuario.id; // Registrar quem fechou o chamado
    }

    // Se o status voltar para um status aberto, remover a data de fechamento
    if (status !== 'Resolvido' && status !== 'Cancelado') {
      updateData.data_fechamento = null;
      updateData.fechado_por = null;
    }

    // Registrar última atualização
    updateData.atualizado_por = usuario.id;
    updateData.data_atualizacao = new Date();

    await chamado.update(updateData);

    req.flash('success', 'Chamado atualizado com sucesso!');
    res.redirect('/chamados');
  } catch (error) {
    console.error('Erro ao atualizar chamado:', error);
    req.flash('error', 'Erro ao atualizar chamado');
    res.redirect(`/chamados/editar/${req.params.id}`);
  }
};

// Excluir chamado - apenas admin
exports.excluirChamado = async (req, res) => {
  try {
    const usuario = req.user;
    
    // Apenas admin pode excluir chamados
    if (usuario.nivel !== 'Admin') {
      req.flash('error', 'Você não tem permissão para excluir chamados');
      return res.redirect('/chamados');
    }
    
    const { id } = req.params;
    const chamado = await Chamado.findByPk(id);

    if (!chamado) {
      req.flash('error', 'Chamado não encontrado');
      return res.redirect('/chamados');
    }

    await chamado.destroy();
    req.flash('success', 'Chamado excluído com sucesso!');
    res.redirect('/chamados');
  } catch (error) {
    console.error('Erro ao excluir chamado:', error);
    req.flash('error', 'Erro ao excluir chamado');
    res.redirect('/chamados');
  }
};

// Dashboard de chamados - acessível por admin e síndico
exports.dashboard = async (req, res) => {
  try {
    const usuario = req.user;
    let whereCondition = {};
    let clienteWhereCondition = {};
    let condominioWhereCondition = {};
    
    // Filtrar dados baseado no nível de acesso
    if (usuario.nivel === 'Sindico') {
      clienteWhereCondition = { condominio_id: usuario.condominio_id };
      condominioWhereCondition = { id: usuario.condominio_id };
    } else if (usuario.nivel === 'Cliente') {
      // Cliente não deveria acessar o dashboard, mas por segurança
      req.flash('error', 'Você não tem permissão para acessar o dashboard');
      return res.redirect('/chamados');
    }

    // Obter estatísticas de chamados
    const totalChamados = await Chamado.count({
      include: [{
        model: Cliente,
        as: 'cliente_chamado',
        where: clienteWhereCondition
      }]
    });
    
    // Status counts com o mesmo filtro
    const abertos = await Chamado.count({ 
      where: { status: 'Aberto' },
      include: [{
        model: Cliente,
        as: 'cliente_chamado',
        where: clienteWhereCondition
      }]
    });
    
    const emAndamento = await Chamado.count({ 
      where: { status: 'Em Andamento' },
      include: [{
        model: Cliente,
        as: 'cliente_chamado',
        where: clienteWhereCondition
      }]
    });
    
    const aguardandoCliente = await Chamado.count({ 
      where: { status: 'Aguardando Cliente' },
      include: [{
        model: Cliente,
        as: 'cliente_chamado',
        where: clienteWhereCondition
      }]
    });
    
    const resolvidos = await Chamado.count({ 
      where: { status: 'Resolvido' },
      include: [{
        model: Cliente,
        as: 'cliente_chamado',
        where: clienteWhereCondition
      }]
    });
    
    const cancelados = await Chamado.count({ 
      where: { status: 'Cancelado' },
      include: [{
        model: Cliente,
        as: 'cliente_chamado',
        where: clienteWhereCondition
      }]
    });

    // Obter chamados ativos por prioridade
    const statusAtivos = ['Aberto', 'Em Andamento', 'Aguardando Cliente'];
    
    const urgentes = await Chamado.count({ 
      where: { 
        prioridade: 'Urgente', 
        status: statusAtivos 
      },
      include: [{
        model: Cliente,
        as: 'cliente_chamado',
        where: clienteWhereCondition
      }]
    });
    
    const altas = await Chamado.count({ 
      where: { 
        prioridade: 'Alta', 
        status: statusAtivos 
      },
      include: [{
        model: Cliente,
        as: 'cliente_chamado',
        where: clienteWhereCondition
      }]
    });
    
    const medias = await Chamado.count({ 
      where: { 
        prioridade: 'Média', 
        status: statusAtivos 
      },
      include: [{
        model: Cliente,
        as: 'cliente_chamado',
        where: clienteWhereCondition
      }]
    });
    
    const baixas = await Chamado.count({ 
      where: { 
        prioridade: 'Baixa', 
        status: statusAtivos 
      },
      include: [{
        model: Cliente,
        as: 'cliente_chamado',
        where: clienteWhereCondition
      }]
    });

    // Obter últimos chamados
    const ultimosChamados = await Chamado.findAll({
      include: [{
        model: Cliente,
        as: 'cliente_chamado',
        where: clienteWhereCondition,
        include: [{
          model: Condominio,
          as: 'condominio_cliente'
        }]
      }],
      order: [['data_abertura', 'DESC']],
      limit: 5
    });
    
    // Dados para o dashboard de condomínios - apenas para admin
    let estatisticasCondominios = null;
    let recentesCondominios = null;
    
    if (usuario.nivel === 'Admin') {
      // Estatísticas de condomínios
      const totalCondominios = await Condominio.count({
        where: condominioWhereCondition
      });
      
      const condominiosAtivos = await Condominio.count({
        where: { 
          ...condominioWhereCondition,
          status: 'Ativo' 
        }
      });
      
      const condominiosInativos = await Condominio.count({
        where: { 
          ...condominioWhereCondition,
          status: 'Inativo' 
        }
      });
      
      const condominiosProspectos = await Condominio.count({
        where: { 
          ...condominioWhereCondition,
          status: 'Prospecto' 
        }
      });
      
      // Adicionando suporte aos novos status de condomínio
      const condominiosImplementacao = await Condominio.count({
        where: { 
          ...condominioWhereCondition,
          status: 'Implementação' 
        }
      });
      
      const condominiosAbrePortas = await Condominio.count({
        where: { 
          ...condominioWhereCondition,
          status: 'Abre Portas' 
        }
      });
      
      const condominiosAgendados = await Condominio.count({
        where: { 
          ...condominioWhereCondition,
          status: 'Agendado Visita' 
        }
      });
      
      // Últimos condomínios cadastrados
      recentesCondominios = await Condominio.findAll({
        where: condominioWhereCondition,
        order: [['createdAt', 'DESC']],
        limit: 5
      });
      
      // Armazenar estatísticas
      estatisticasCondominios = {
        total: totalCondominios,
        ativos: condominiosAtivos,
        inativos: condominiosInativos,
        prospectos: condominiosProspectos,
        implementacao: condominiosImplementacao,
        abrePortas: condominiosAbrePortas,
        agendados: condominiosAgendados
      };
    }

    res.render('chamados/dashboard', {
      title: 'Dashboard de Chamados',
      estatisticas: {
        total: totalChamados,
        abertos,
        emAndamento,
        aguardandoCliente,
        resolvidos,
        cancelados,
        urgentes,
        altas,
        medias,
        baixas
      },
      ultimosChamados,
      // Dados de condomínios (apenas para admin)
      estatisticasCondominios,
      recentesCondominios,
      usuario,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    req.flash('error', 'Erro ao carregar dashboard');
    res.redirect('/');
  }
};

// Buscar clientes por condomínio (para o formulário dinâmico)
exports.buscarClientesPorCondominio = async (req, res) => {
  try {
    const usuario = req.user;
    const { condominioId } = req.params;
    
    // Verificar permissões
    if (usuario.nivel === 'Sindico' && condominioId != usuario.condominio_id) {
      return res.status(403).json({ message: 'Você só pode buscar clientes do seu condomínio' });
    }
    
    const clientes = await Cliente.findAll({
      where: { condominio_id: condominioId, status: 'Ativo' },
      order: [['nome', 'ASC']]
    });

    res.json(clientes);
  } catch (error) {
    console.error('Erro ao buscar clientes por condomínio:', error);
    res.status(500).json({ message: 'Erro ao buscar clientes' });
  }
};

// Visualizar detalhes do chamado
exports.visualizarChamado = async (req, res) => {
  try {
    const usuario = req.user;
    const { id } = req.params;
    
    const chamado = await Chamado.findByPk(id, {
      include: [{
        model: Cliente,
        as: 'cliente_chamado',
        include: [{
          model: Condominio,
          as: 'condominio_cliente'
        }]
      }]
    });

    if (!chamado) {
      req.flash('error', 'Chamado não encontrado');
      return res.redirect('/chamados');
    }

    // Verificar permissões de visualização
    if (usuario.nivel === 'Cliente' && chamado.cliente_id !== usuario.cliente_id) {
      req.flash('error', 'Você não tem permissão para visualizar este chamado');
      return res.redirect('/chamados');
    } else if (usuario.nivel === 'Sindico' && chamado.cliente_chamado.condominio_id !== usuario.condominio_id) {
      req.flash('error', 'Você não tem permissão para visualizar este chamado');
      return res.redirect('/chamados');
    }

    res.render('chamados/visualizar', {
      title: `Chamado #${chamado.id}`,
      chamado,
      usuario,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao visualizar chamado:', error);
    req.flash('error', 'Erro ao carregar detalhes do chamado');
    res.redirect('/chamados');
  }
};

// Adicionar comentário ao chamado
exports.adicionarComentario = async (req, res) => {
  try {
    const usuario = req.user;
    const { id } = req.params;
    const { comentario } = req.body;

    const chamado = await Chamado.findByPk(id, {
      include: [{
        model: Cliente,
        as: 'cliente_chamado'
      }]
    });

    if (!chamado) {
      req.flash('error', 'Chamado não encontrado');
      return res.redirect('/chamados');
    }

    // Verificar permissões
    if (usuario.nivel === 'Cliente' && chamado.cliente_id !== usuario.cliente_id) {
      req.flash('error', 'Você não tem permissão para comentar neste chamado');
      return res.redirect('/chamados');
    } else if (usuario.nivel === 'Sindico' && chamado.cliente_chamado.condominio_id !== usuario.condominio_id) {
      req.flash('error', 'Você não tem permissão para comentar neste chamado');
      return res.redirect('/chamados');
    }

    // Aqui você poderia implementar a lógica para adicionar comentários
    // No momento, apenas enviamos uma mensagem informativa
    req.flash('info', 'Funcionalidade de comentários em desenvolvimento');
    res.redirect(`/chamados/visualizar/${id}`);
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    req.flash('error', 'Erro ao adicionar comentário');
    res.redirect(`/chamados/visualizar/${req.params.id}`);
  }
};

// Relatório de chamados por período - apenas para admin e síndico
exports.relatorio = async (req, res) => {
  try {
    const usuario = req.user;
    
    // Apenas admin e síndico podem gerar relatórios
    if (usuario.nivel === 'Cliente') {
      req.flash('error', 'Você não tem permissão para acessar relatórios');
      return res.redirect('/chamados');
    }
    
    const { dataInicio, dataFim, status, prioridade } = req.query;
    
    // Criar condições de filtro
    const where = {};
    const includeWhere = {};
    
    // Filtrar por condomínio para síndico
    if (usuario.nivel === 'Sindico') {
      includeWhere.condominio_id = usuario.condominio_id;
    }
    
    // Filtrar por data
    if (dataInicio && dataFim) {
      where.data_abertura = {
        [Op.between]: [new Date(dataInicio), new Date(dataFim)]
      };
    }
    
    // Filtrar por status
    if (status && status !== 'Todos') {
      where.status = status;
    }
    
    // Filtrar por prioridade
    if (prioridade && prioridade !== 'Todas') {
      where.prioridade = prioridade;
    }
    
    // Buscar os chamados com os filtros aplicados
    const chamados = await Chamado.findAll({
      where,
      include: [{
        model: Cliente,
        as: 'cliente_chamado',
        where: Object.keys(includeWhere).length > 0 ? includeWhere : undefined,
        include: [{
          model: Condominio,
          as: 'condominio_cliente'
        }]
      }],
      order: [['data_abertura', 'DESC']]
    });
    
    res.render('chamados/relatorio', {
      title: 'Relatório de Chamados',
      chamados,
      filtros: {
        dataInicio: dataInicio || '',
        dataFim: dataFim || '',
        status: status || 'Todos',
        prioridade: prioridade || 'Todas'
      },
      usuario,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    req.flash('error', 'Erro ao gerar relatório');
    res.redirect('/chamados');
  }
};