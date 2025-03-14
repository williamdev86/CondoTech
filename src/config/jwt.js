// src/config/jwt.js
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const Usuario = require('../models/usuario');

const secretKey = process.env.JWT_SECRET_KEY || 'condotech_jwt_secret';
const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

// Função personalizada para extrair o token de várias fontes
const customJwtExtractor = (req) => {
  // Verificar em cookies, sessão e cabeçalho de autorização
  let token = null;
  
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.session && req.session.token) {
    token = req.session.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  return token;
};

// Configuração da estratégia JWT para passport
const jwtOptions = {
  jwtFromRequest: customJwtExtractor,
  secretOrKey: secretKey
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    console.log('JWT Strategy - Payload recebido:', payload);
    
    const usuario = await Usuario.findByPk(payload.id, {
      include: [
        { association: 'condominio_usuario' },
        { association: 'cliente_usuario' }
      ]
    });

    if (!usuario || !usuario.ativo) {
      console.log('Usuário não encontrado ou inativo:', payload.id);
      return done(null, false);
    }

    console.log('Usuário autenticado com sucesso:', usuario.id, usuario.email);
    return done(null, usuario);
  } catch (error) {
    console.error('Erro na estratégia JWT:', error);
    return done(error, false);
  }
}));

// Gerar token JWT
const gerarToken = (usuario) => {
  const payload = {
    id: usuario.id,
    email: usuario.email,
    nivel: usuario.nivel,
    condominio_id: usuario.condominio_id,
    cliente_id: usuario.cliente_id
  };

  return jwt.sign(payload, secretKey, { expiresIn });
};

// Middleware para verificar autenticação com compatibilidade req.usuario
const autenticar = (req, res, next) => {
  console.log('Middleware de autenticação chamado');
  console.log('URL:', req.method, req.originalUrl);
  console.log('Token presente:', !!customJwtExtractor(req));
  
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      console.error('Erro na autenticação:', err);
      return next(err);
    }
    if (!user) {
      console.log('Usuário não autenticado, redirecionando para login');
      return res.redirect('/login');
    }
    
    console.log('Usuário autenticado no middleware:', user.id, user.email, 'Nível:', user.nivel);
    
    // Definir tanto req.user quanto req.usuario para compatibilidade
    req.user = user;
    req.usuario = user;
    
    next();
  })(req, res, next);
};

// Middleware para verificar nível de acesso
const autorizar = (...niveisPermitidos) => {
  return (req, res, next) => {
    console.log('Middleware de autorização chamado');
    console.log('Níveis permitidos:', niveisPermitidos);
    console.log('Nível do usuário:', req.user ? req.user.nivel : 'indefinido');
    
    if (!req.user) {
      console.log('Usuário não autenticado em autorizar');
      req.flash('error', 'Você precisa estar logado para continuar');
      return res.redirect('/login');
    }

    if (niveisPermitidos.includes(req.user.nivel)) {
      console.log('Autorização concedida para', req.user.email);
      return next();
    }

    console.log('Autorização negada para', req.user.email, '- Nível requerido:', niveisPermitidos);
    req.flash('error', 'Você não tem permissão para acessar esta área');
    return res.redirect('/');
  };
};

// Função para verificar token manualmente
const verificarTokenManual = (token) => {
  try {
    const decoded = jwt.verify(token, secretKey);
    console.log('Token verificado manualmente:', decoded);
    return decoded;
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return null;
  }
};

module.exports = {
  gerarToken,
  autenticar,
  autorizar,
  secretKey,
  verificarTokenManual
};