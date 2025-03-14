const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Condominio = sequelize.define('Condominio', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  endereco: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cidade: {
    type: DataTypes.STRING,
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(2),
    allowNull: false
  },
  cep: {
    type: DataTypes.STRING(9),
    allowNull: false
  },
  quantidade_apartamentos: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  quantidade_blocos: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  sindico: {
    type: DataTypes.STRING,
    allowNull: false
  },
  zelador: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telefone_zelador: {
    type: DataTypes.STRING,
    allowNull: true
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Ativo', 'Inativo', 'Prospecto', 'Abre Portas', 'Implementação', 'Agendado Visita'),
    defaultValue: 'Ativo'
  }
}, {
  tableName: 'condominios',
  timestamps: true
});

module.exports = Condominio;