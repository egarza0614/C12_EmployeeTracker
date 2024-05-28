const express = require('express');
const router = express.Router();
const { pool } = require('../../db'); 

// Employee Routes
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT e.*, r.title, r.salary, d.name AS department, 
             CONCAT(m.first_name, ' ', m.last_name) AS manager
      FROM employees e
      LEFT JOIN roles r ON e.role_id = r.id
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN employees m ON e.manager_id = m.id
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});
// Add new employee
router.post('/', async (req, res) => { 
  try {
    const { first_name, last_name, role_id, manager_id } = req.body;
    const result = await pool.query(
      'INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [first_name, last_name, role_id, manager_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

// Update employee
router.put('/:id', async (req, res) => { 
  try {
    const { id } = req.params;
    const { role_id } = req.body;
    const result = await pool.query(
      'UPDATE employees SET role_id = $1 WHERE id = $2 RETURNING *',
      [role_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update employee role' });
  }
});

// Update employee's manager
router.put('/:id/manager', async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const { managerId } = req.body;
  
      // Input validation
      if (isNaN(employeeId) || (!managerId && managerId !== null)) {
        return res.status(400).json({ error: 'Invalid employee or manager ID' });
      }
  
      // Check if employee and manager exist
      const employeeResult = await pool.query('SELECT * FROM employees WHERE id = $1', [employeeId]);
      const managerResult = managerId 
        ? await pool.query('SELECT * FROM employees WHERE id = $1', [managerId]) 
        : { rows: [null] }; // If no manager, treat as null
  
      if (employeeResult.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      if (managerId && managerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Manager not found' });
      }
  
      // Update employee's manager
      const updateResult = await pool.query(
        'UPDATE employees SET manager_id = $1 WHERE id = $2 RETURNING *',
        [managerId, employeeId]
      );
  
      res.json(updateResult.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update employee manager' });
    }
  });

  // Delete an employee
router.delete('/:id', async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      if (isNaN(employeeId)) {
        return res.status(400).json({ error: 'Invalid employee ID' });
      }
  
      // Check if the employee manages other employees
      const managerResult = await pool.query('SELECT * FROM employees WHERE manager_id = $1', [employeeId]);
      if (managerResult.rows.length > 0) {
        return res.status(400).json({ error: 'Cannot delete employee. They manage other employees.' });
      }
  
      const result = await pool.query('DELETE FROM employees WHERE id = $1', [employeeId]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }
  
      res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete employee' });
    }
  });
  
module.exports = router; // Export the router
