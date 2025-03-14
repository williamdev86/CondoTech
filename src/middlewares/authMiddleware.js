
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');

exports.verificarLogin = async (req, res, next) => {
  // Verificar se há um token em cookies ou sessão
  const token = req.cookies.token || (req.session && req.session.token);
  
  if (!token) {
    return res.redirect('/login');
  }
  
  try {
    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || 'condotech_jwt_secret');
    
    // Buscar usuário no banco de dados
    const usuario = await Usuario.findByPk(decoded.id);
    
    if (!usuario || !usuario.ativo) {
      return res.redirect('/login');
    }
    
    // Disponibilizar o usuário para as views
    res.locals.usuarioLogado = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      nivel: usuario.nivel
    };
    
    // Continuar
    next();
  } catch (error) {
    return res.redirect('/login');
  }
};

exports.requererNivel = (...niveisPermitidos) => {
  return (req, res, next) => {
    if (!res.locals.usuarioLogado) {
      return res.redirect('/login');
    }
    
    if (niveisPermitidos.includes(res.locals.usuarioLogado.nivel)) {
      return next();
    }
    
    res.render('403', { 
      title: 'Acesso Negado',
      message: 'Você não tem permissão para acessar esta página'
    });
  };
};