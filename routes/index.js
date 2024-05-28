const express = require('express');
const router = express.Router();

const departmentRoutes = require('./api/departments');
const roleRoutes = require('./api/roles');
const employeeRoutes = require('./api/employees');

router.use('/departments', departmentRoutes);
router.use('/roles', roleRoutes);
router.use('/employees', employeeRoutes);

module.exports = router; 
