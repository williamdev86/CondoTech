const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const { verificarTokenManual } = require('./src/config/jwt');
const sequelize = require('./src/config/database');

// Importar modelos através do arquivo index
const { Usuario, Cliente, Condominio, Chamado } = require('./src/models/index');

// Importar rotas
const condominioRoutes = require('./src/routes/condominioRoutes');
const clienteRoutes = require('./src/routes/clienteRoutes');
const chamadoRoutes = require('./src/routes/chamadoRoutes');
const authRoutes = require('./src/routes/authRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');

// Configurar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar express-ejs-layouts
app.use(expressLayouts);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Middleware para arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsing de requisições
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configurar sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'condotech_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 } // 1 hora
}));

// Configurar passport para JWT
app.use(passport.initialize());

// Configurar flash messages
app.use(flash());

// Middleware global para variáveis de templates
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.messages = {
    success: req.flash('success'),
    error: req.flash('error')
  };
  res.locals.usuarioLogado = null; // Inicializar como null
  next();
});

// Middleware para disponibilizar informações do usuário nas views
app.use(async (req, res, next) => {
  // Tentar obter token de cookies ou session
  const token = req.cookies?.token || req.session?.token;
  
  if (token) {
    const decoded = verificarTokenManual(token);
    if (decoded) {
      try {
        // Buscar usuário com base no ID decodificado
        const usuario = await Usuario.findByPk(decoded.id, {
          include: [
            { association: 'condominio_usuario' },
            { association: 'cliente_usuario' }
          ]
        });
        
        if (usuario) {
          // Disponibilizar o usuário para todas as views
          res.locals.usuarioLogado = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            nivel: usuario.nivel,
            condominio: usuario.condominio_usuario,
            cliente: usuario.cliente_usuario
          };
          
          // Disponibilizar para uso no req também
          req.usuario = usuario;
        }
      } catch (error) {
        console.error('Erro ao buscar usuário após verificar token:', error);
      }
    }
  }
  
  next();
});

// Rotas públicas
app.get('/login', (req, res) => {
  // Redirecionar se já estiver logado
  if (res.locals.usuarioLogado) {
    return res.redirect('/');
  }
  
  res.render('auth/login', { 
    title: 'Login - CondoTech',
    layout: './layouts/auth' // Layout específico para páginas de autenticação
  });
});

// Rotas de autenticação
app.use('/auth', authRoutes);

// Middleware para verificar autenticação em rotas protegidas
const verificarAutenticacao = (req, res, next) => {
  if (!res.locals.usuarioLogado) {
    req.flash('error', 'Por favor, faça login para continuar');
    return res.redirect('/login');
  }
  next();
};

// Rotas protegidas
app.get('/', verificarAutenticacao, (req, res) => {
  res.render('index', { 
    title: 'CondoTech - Sistema de Gestão de Suporte para Condomínios'
  });
});

// Proteger rotas principais com autenticação
app.use('/condominios', verificarAutenticacao, condominioRoutes);
app.use('/clientes', verificarAutenticacao, clienteRoutes);
app.use('/chamados', verificarAutenticacao, chamadoRoutes);
app.use('/usuarios', verificarAutenticacao, usuarioRoutes);

// Rota para logout
app.get('/logout', (req, res) => {
  // Limpar token de cookie e sessão
  res.clearCookie('token');
  if (req.session) {
    req.session.token = null;
    req.session.usuario = null;
  }
  
  req.flash('success', 'Logout realizado com sucesso');
  res.redirect('/login');
});

// Rota para página não encontrada
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Página não encontrada'
  });
});

// Sincronizar modelos com o banco de dados
// Alterado para forçar alter: true para atualizar o ENUM de status do condomínio
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Banco de dados sincronizado com alter:true');
    
    // Executar query específica para atualizar o ENUM (caso o sync não funcione adequadamente)
    return sequelize.query(`
      ALTER TABLE condominios 
      MODIFY COLUMN status ENUM('Ativo', 'Inativo', 'Prospecto', 'Abre Portas', 'Implementação', 'Agendado Visita') 
      DEFAULT 'Ativo';
    `).catch(err => {
      console.log('Alteração manual da coluna status falhou, mas isso pode ser normal se o sync já fez a alteração');
      console.log('Detalhes do erro (pode ser ignorado):', err.message);
      return Promise.resolve(); // Continuar mesmo se esta query falhar
    });
  })
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor CondoTech rodando na porta ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Erro ao sincronizar banco de dados:', error);
  });