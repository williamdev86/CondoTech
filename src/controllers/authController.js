// src/controllers/authController.js
const Usuario = require('../models/usuario');
const { gerarToken } = require('../config/jwt');

// Login
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    console.log('Tentativa de login com:', { email, senha: '*****' });

    const usuario = await Usuario.findOne({ 
      where: { email },
      include: [
        { association: 'condominio_usuario' },
        { association: 'cliente_usuario' }
      ]
    });

    if (!usuario) {
      console.log('Usuário não encontrado para o email:', email);
      req.flash('error', 'Credenciais inválidas');
      return res.redirect('/login');
    }

    const senhaCorreta = await usuario.verificarSenha(senha);
    if (!senhaCorreta) {
      console.log('Senha incorreta para o usuário:', email);
      req.flash('error', 'Credenciais inválidas');
      return res.redirect('/login');
    }

    if (!usuario.ativo) {
      console.log('Usuário inativo:', email);
      req.flash('error', 'Usuário inativo');
      return res.redirect('/login');
    }

    // Atualizar último acesso
    usuario.ultimo_acesso = new Date();
    await usuario.save();

    // Gerar token
    const token = gerarToken(usuario);
    console.log('Token gerado com sucesso');

    // Dados do usuário para enviar ao cliente
    const usuarioData = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      nivel: usuario.nivel,
      condominio: usuario.condominio_usuario ? {
        id: usuario.condominio_usuario.id,
        nome: usuario.condominio_usuario.nome
      } : null,
      cliente: usuario.cliente_usuario ? {
        id: usuario.cliente_usuario.id,
        nome: usuario.cliente_usuario.nome
      } : null
    };

    // Armazenar token em cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    // Armazenar também na sessão
    req.session.token = token;
    req.session.usuario = usuarioData;

    console.log('Login bem-sucedido para:', email);
    
    // Redirecionar com base no nível de acesso
    if (usuario.nivel === 'Admin') {
      res.redirect('/chamados/dashboard');
    } else if (usuario.nivel === 'Sindico') {
      res.redirect('/chamados');
    } else {
      res.redirect('/chamados'); // Cliente vai para lista de seus chamados
    }
  } catch (error) {
    console.error('Erro detalhado no login:', error);
    req.flash('error', 'Erro ao fazer login');
    res.redirect('/login');
  }
};

// Verificar token atual
exports.verificarToken = async (req, res) => {
  // Se chegou aqui, o middleware de autenticação já validou o token
  const usuarioData = {
    id: req.user.id,
    nome: req.user.nome,
    email: req.user.email,
    nivel: req.user.nivel,
    condominio: req.user.condominio_usuario ? {
      id: req.user.condominio_usuario.id,
      nome: req.user.condominio_usuario.nome
    } : null,
    cliente: req.user.cliente_usuario ? {
      id: req.user.cliente_usuario.id,
      nome: req.user.cliente_usuario.nome
    } : null
  };

  res.json({ usuario: usuarioData });
};

// Gerenciamento de usuários (para Administradores)
exports.criarUsuario = async (req, res) => {
  try {
    const { nome, email, senha, nivel, condominio_id, cliente_id } = req.body;

    // Verificar se o email já está em uso
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha,
      nivel,
      condominio_id: condominio_id || null,
      cliente_id: cliente_id || null,
      ativo: true
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      usuario: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        nivel: novoUsuario.nivel
      }
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro ao criar usuário' });
  }
};

// Logout
exports.logout = (req, res) => {
  // Limpar token da sessão
  if (req.session) {
    req.session.token = null;
    req.session.usuario = null;
  }
  
  // Limpar cookie
  res.clearCookie('token');
  
  req.flash('success', 'Logout realizado com sucesso');
  res.redirect('/login');
};