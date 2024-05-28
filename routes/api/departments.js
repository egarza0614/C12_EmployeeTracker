const express = require('express');
const router = express.Router();
const { pool } = require('../../db');

// Department Routes
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM departments');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Add new department
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query('INSERT INTO departments (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add department' });
  }
});

// Delete a department
router.delete('/:id', async (req, res) => {
    try {
      const departmentId = parseInt(req.params.id);
      if (isNaN(departmentId)) {
        return res.status(400).json({ error: 'Invalid department ID' });
      }
  
      // Check if roles or employees are associated with this department
      const roleResult = await pool.query('SELECT * FROM roles WHERE department_id = $1', [departmentId]);
      if (roleResult.rows.length > 0) {
        return res.status(400).json({ error: 'Cannot delete department. Roles are associated with it.' });
      }
  
      const employeeResult = await pool.query('SELECT * FROM employees WHERE role_id IN (SELECT id FROM roles WHERE department_id = $1)', [departmentId]);
      if (employeeResult.rows.length > 0) {
        return res.status(400).json({ error: 'Cannot delete department. Employees are associated with its roles.' });
      }
  
      const result = await pool.query('DELETE FROM departments WHERE id = $1', [departmentId]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Department not found' });
      }
  
      res.json({ message: 'Department deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete department' });
    }
  });
  
module.exports = router; // Export the router
