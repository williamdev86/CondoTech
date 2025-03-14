const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Cliente = require('./cliente');

const Chamado = sequelize.define('Chamado', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'clientes',
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.ENUM('Internet Lenta', 'Sem Conexão', 'Instabilidade', 'Instalação', 'Mudança de Endereço', 'Outro'),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  prioridade: {
    type: DataTypes.ENUM('Baixa', 'Média', 'Alta', 'Urgente'),
    defaultValue: 'Média'
  },
  status: {
    type: DataTypes.ENUM('Aberto', 'Em Andamento', 'Aguardando Cliente', 'Resolvido', 'Cancelado'),
    defaultValue: 'Aberto'
  },
  data_abertura: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  data_fechamento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  solucao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tecnico_responsavel: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'chamados',
  timestamps: true
});

// Definir relacionamento entre Chamado e Cliente
Chamado.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Cliente.hasMany(Chamado, { foreignKey: 'cliente_id', as: 'chamados' });

module.exports = Chamado;