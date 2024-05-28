// models.js
require('dotenv').config();

const { Sequelize, DataTypes } = require('sequelize');

// Create the sequelize instance
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

// Department Model
const Department = sequelize.define('department', { /* ... your existing department code ... */ });

// Role Model
const Role = sequelize.define('role', { /* ... your existing role code ... */ });

// Employee Model
const Employee = sequelize.define('employee', { /* ... your existing employee code ... */ });

// Define Associations (Relationships)
Department.hasMany(Role, { foreignKey: 'department_id' });
Role.belongsTo(Department, { foreignKey: 'department_id' });

Role.hasMany(Employee, { foreignKey: 'role_id' });
Employee.belongsTo(Role, { foreignKey: 'role_id' });

Employee.hasOne(Employee, { as: 'manager', foreignKey: 'manager_id' });
Employee.belongsTo(Employee, { as: 'manager', foreignKey: 'manager_id' });

module.exports = { 
  Department, 
  Role, 
  Employee, 
  pool: sequelize.connectionManager.pool // Export the pool as well
};
