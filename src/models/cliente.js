const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cliente = sequelize.define('Cliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cpf: {
    type: DataTypes.STRING(14),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Novos campos
  telefone2: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nome_mae: {
    type: DataTypes.STRING,
    allowNull: true
  },
  data_nascimento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  logradouro: {
    type: DataTypes.STRING,
    allowNull: true
  },
  numero: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cep: {
    type: DataTypes.STRING(9),
    allowNull: true
  },
  cidade: {
    type: DataTypes.STRING,
    allowNull: true
  },
  plano_contratado: {
    type: DataTypes.STRING,
    allowNull: true
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  consultor: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Campos existentes continuam
  bloco: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apartamento: {
    type: DataTypes.STRING,
    allowNull: false
  },
  condominio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'condominios',
      key: 'id'
    }
  },
  data_cadastro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('Ativo', 'Inativo'),
    defaultValue: 'Ativo'
  }
}, {
  tableName: 'clientes',
  timestamps: true
});

// NÃO DEFINA ASSOCIAÇÕES AQUI
// As associações serão definidas no arquivo src/models/index.js

module.exports = Cliente;