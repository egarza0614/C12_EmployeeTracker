const express = require('express');
const router = express.Router();
const { pool } = require('../../db'); 

// Roles Routes
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT roles.*, departments.name AS department_name
      FROM roles
      LEFT JOIN departments ON roles.department_id = departments.id
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// POST /api/roles - Add a new role
router.post('/', async (req, res) => {
  try {
    const { title, salary, department_id } = req.body;

    // Input validation
    if (!title || !salary || !department_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3) RETURNING *',
      [title, salary, department_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add role' });
  }
});

// DELETE /api/roles/:id - Delete a role
router.delete('/:id', async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      if (isNaN(roleId)) {
        return res.status(400).json({ error: 'Invalid role ID' });
      }
  
      // Check if employees are associated with this role
      const employeeResult = await pool.query('SELECT * FROM employees WHERE role_id = $1', [roleId]);
      if (employeeResult.rows.length > 0) {
        return res.status(400).json({ error: 'Cannot delete role. Employees are associated with it.' });
      }
  
      const result = await pool.query('DELETE FROM roles WHERE id = $1', [roleId]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Role not found' });
      }
  
      res.json({ message: 'Role deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete role' });
    }
  });
  
module.exports = router; // Export the router
