// src/models/usuario.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nivel: {
    type: DataTypes.ENUM('Cliente', 'Sindico', 'Admin'),
    allowNull: false,
    defaultValue: 'Cliente'
  },
  condominio_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'condominios',
      key: 'id'
    }
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clientes',
      key: 'id'
    }
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ultimo_acesso: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.senha) {
        usuario.senha = await bcrypt.hash(usuario.senha, 10);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('senha')) {
        usuario.senha = await bcrypt.hash(usuario.senha, 10);
      }
    }
  }
});

// Método para verificar senha - melhorado com async/await e tratamento de erros
Usuario.prototype.verificarSenha = async function(senha) {
  try {
    // Retorna true se a senha corresponder, false caso contrário
    return await bcrypt.compare(senha, this.senha);
  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    return false; // Retorna false em caso de erro
  }
};

// NÃO DEFINA ASSOCIAÇÕES AQUI
// As associações serão definidas no arquivo src/models/index.js

module.exports = Usuario;