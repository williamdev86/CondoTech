// src/models/index.js
const Usuario = require('./usuario');
const Cliente = require('./cliente');
const Condominio = require('./condominio');
const Chamado = require('./chamado');

// Definir associações com aliases únicos
Usuario.belongsTo(Condominio, { foreignKey: 'condominio_id', as: 'condominio_usuario' });
Usuario.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente_usuario' });

// Outras associações
Cliente.belongsTo(Condominio, { foreignKey: 'condominio_id', as: 'condominio_cliente' });
Condominio.hasMany(Cliente, { foreignKey: 'condominio_id', as: 'clientes_condominio' });

// Alterando o alias para evitar conflito
Chamado.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente_chamado' });
Cliente.hasMany(Chamado, { foreignKey: 'cliente_id', as: 'chamados_cliente' });

module.exports = {
  Usuario,
  Cliente,
  Condominio,
  Chamado
};