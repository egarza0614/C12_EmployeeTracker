const readline = require('readline-sync');
const inquirer = require('inquirer');
const { pool } = require('./db'); // Import the database connection pool

function displayMenu() {
  console.log("\nEmployee Management System");
  console.log("-------------------------");
  console.log("1. View All Departments");
  console.log("2. View All Roles");
  console.log("3. View All Employees");
  console.log("4. Add a Department");
  console.log("5. Add a Role");
  console.log("6. Add an Employee");
  console.log("7. Update Employee Role");
  console.log("8. Update Employee Manager");
  console.log("9. Delete Department"); 
  console.log("10. Delete Role"); 
  console.log("11. Delete Employee"); 
  console.log("12. Exit");
}

async function main() {
  try {
    // Test the database connection
    await pool.query('SELECT NOW()'); 
    console.log('Connected to the database.');

    while (true) {
      displayMenu();
      const choice = readline.question('What would you like to do? ');

      switch (choice) {
        case '1': await viewAllDepartments(); break;
        case '2': await viewAllRoles(); break;
        case '3': await viewAllEmployees(); break;
        case '4': await addDepartment(); break;
        case '5': await addRole(); break;
        case '6': await addEmployee(); break;
        case '7': await updateEmployeeRole(); break;
        case '8': await updateEmployeeManager(); break;
        case '9': await deleteDepartment(); break;
        case '10': await deleteRole(); break;
        case '11': await deleteEmployee(); break;
        case '12': process.exit(0); break;
        default: console.log("Invalid choice. Please try again.");
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// View Functions

async function viewAllDepartments() {
  const { rows } = await pool.query('SELECT * FROM departments');
  console.table(rows);
}

async function viewAllRoles() {
  const { rows } = await pool.query(`
    SELECT roles.*, departments.name AS department_name
    FROM roles
    LEFT JOIN departments ON roles.department_id = departments.id
  `);
  console.table(rows);
}

async function viewAllEmployees() {
  const { rows } = await pool.query(`
    SELECT e.*, r.title, r.salary, d.name AS department, 
           CONCAT(m.first_name, ' ', m.last_name) AS manager
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON r.department_id = d.id
    LEFT JOIN employees m ON e.manager_id = m.id
  `);
  console.table(rows);
}

// Add Functions
async function addDepartment() {
  const name = readline.question('Enter the name of the new department: ');
  // Input validation
  if (!name.trim()) {
    console.log('Department name cannot be empty. Please try again.');
    return;
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO departments (name) VALUES ($1) RETURNING *',
      [name]
    );
    console.log(`Department '${rows[0].name}' added successfully!`);
  } catch (err) {
    console.error('Error adding department:', err.message); // Log the error message
  }
}

async function addRole() {
  const title = readline.question('Enter the title of the new role: ');
  const salaryInput = readline.question('Enter the salary for the new role: ');
  const departmentName = readline.question('Enter the department for the new role: ');

  const salary = parseFloat(salaryInput);

  // Input validation
  if (!title.trim() || isNaN(salary) || salary <= 0 || !departmentName.trim()) {
    console.log('Invalid input. Please try again.');
    return;
  }

  try {
    // Check if the department exists
    const departmentResult = await pool.query('SELECT * FROM departments WHERE name = $1', [departmentName]);
    if (departmentResult.rows.length === 0) {
      console.log(`Department '${departmentName}' not found.`);
      return;
    }

    const departmentId = departmentResult.rows[0].id;

    // Insert the new role
    const result = await pool.query(
      'INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3) RETURNING *',
      [title, salary, departmentId]
    );
    console.log(`Role '${result.rows[0].title}' added successfully to department '${departmentName}'!`);
  } catch (err) {
    console.error('Error adding role:', err.message);
  }
}

async function addEmployee() {
  try {
    // Fetch roles and managers for display
    const { rows: roles } = await pool.query('SELECT * FROM roles');
    const { rows: managers } = await pool.query('SELECT * FROM employees');

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'firstName',
        message: "Enter the employee's first name:",
        validate: input => input.trim() !== '',
      },
      {
        type: 'input',
        name: 'lastName',
        message: "Enter the employee's last name:",
        validate: input => input.trim() !== '',
      },
      {
        type: 'list',
        name: 'roleId',
        message: "Select the employee's role:",
        choices: roles.map(role => ({
          name: role.title,
          value: role.id,
        })),
      },
      {
        type: 'list',
        name: 'managerId',
        message: "Select the employee's manager (or 'None' for no manager):",
        choices: [
          { name: 'None', value: null },
          ...managers.map(manager => ({
            name: `${manager.first_name} ${manager.last_name}`,
            value: manager.id,
          })),
        ],
      },
    ]);

    await pool.query(
      'INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
      [answers.firstName, answers.lastName, answers.roleId, answers.managerId]
    );

    console.log(`Employee ${answers.firstName} ${answers.lastName} added successfully!`);
  } catch (err) {
    console.error('Error adding employee:', err.message);
  }
}

// Update Functions
async function updateEmployeeRole() {
  try {
    // Fetch employees and roles for display
    const { rows: employees } = await pool.query('SELECT * FROM employees');
    const { rows: roles } = await pool.query('SELECT * FROM roles');

    const { employeeId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'employeeId',
        message: 'Select the employee to update:',
        choices: employees.map(employee => ({
          name: `${employee.first_name} ${employee.last_name}`,
          value: employee.id,
        })),
      },
    ]);

    const { roleId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'roleId',
        message: "Select the employee's new role:",
        choices: roles.map(role => ({
          name: role.title,
          value: role.id,
        })),
      },
    ]);

    // Update the employee's role
    await pool.query('UPDATE employees SET role_id = $1 WHERE id = $2', [roleId, employeeId]);
    console.log('Employee role updated successfully!');
  } catch (error) {
    console.error('Error updating employee role:', error.message);
  }
}

async function updateEmployeeManager() {
  try {
    // Fetch employees for display
    const { rows: employees } = await pool.query('SELECT * FROM employees');

    const { employeeId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'employeeId',
        message: 'Select the employee to update:',
        choices: employees.map(employee => ({
          name: `${employee.first_name} ${employee.last_name}`,
          value: employee.id,
        })),
      },
    ]);

    const { managerId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'managerId',
        message: "Select the employee's new manager (or 'None' for no manager):",
        choices: [
          { name: 'None', value: null },
          ...employees.map(employee => ({
            name: `${employee.first_name} ${employee.last_name}`,
            value: employee.id,
          })),
        ],
      },
    ]);

    // Update the employee's manager
    await pool.query('UPDATE employees SET manager_id = $1 WHERE id = $2', [managerId, employeeId]);
    console.log('Employee manager updated successfully!');
  } catch (error) {
    console.error('Error updating employee manager:', error.message);
  }
}

// Delete Functions
async function deleteDepartment() {
  try {
    // Fetch departments for display
    const { rows: departments } = await pool.query('SELECT * FROM departments');

    if (departments.length === 0) {
      console.log('No departments found to delete.');
      return;
    }

    const { departmentId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'departmentId',
        message: 'Select a department to delete:',
        choices: departments.map(dept => ({
          name: dept.name,
          value: dept.id
        })),
      },
    ]);

    // Check for associated roles or employees
    const roleResult = await pool.query('SELECT * FROM roles WHERE department_id = $1', [departmentId]);
    if (roleResult.rows.length > 0) {
      console.error('Cannot delete department. Roles are associated with it.');
      return;
    }

    const employeeResult = await pool.query(
      'SELECT * FROM employees WHERE role_id IN (SELECT id FROM roles WHERE department_id = $1)',
      [departmentId]
    );
    if (employeeResult.rows.length > 0) {
      console.error('Cannot delete department. Employees are associated with its roles.');
      return;
    }

    // Delete the department
    await pool.query('DELETE FROM departments WHERE id = $1', [departmentId]);
    console.log('Department deleted successfully!');

  } catch (error) {
    console.error('Error deleting department:', error.message);
  }
}


async function deleteRole() {
  try {
    // Fetch roles for display
    const { rows: roles } = await pool.query('SELECT * FROM roles');

    const { roleId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'roleId',
        message: 'Select a role to delete:',
        choices: roles.map(role => ({
          name: role.title,
          value: role.id,
        })),
      },
    ]);

    // Check if employees are associated with this role
    const employeeResult = await pool.query('SELECT * FROM employees WHERE role_id = $1', [roleId]);
    if (employeeResult.rows.length > 0) {
      return console.error('Cannot delete role. Employees are associated with it.');
    }

    // Delete the role
    await pool.query('DELETE FROM roles WHERE id = $1', [roleId]);
    console.log('Role deleted successfully!');
  } catch (error) {
    console.error('Error deleting role:', error.message);
  }
}

async function deleteEmployee() {
  try {
    // Fetch employees for display
    const { rows: employees } = await pool.query('SELECT * FROM employees');

    const { employeeId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'employeeId',
        message: 'Select an employee to delete:',
        choices: employees.map(employee => ({
          name: `${employee.first_name} ${employee.last_name}`,
          value: employee.id,
        })),
      },
    ]);

    // Check if the employee manages other employees
    const managerResult = await pool.query('SELECT * FROM employees WHERE manager_id = $1', [employeeId]);
    if (managerResult.rows.length > 0) {
      return console.error('Cannot delete employee. They manage other employees.');
    }

    // Delete the employee
    await pool.query('DELETE FROM employees WHERE id = $1', [employeeId]);
    console.log('Employee deleted successfully!');
  } catch (error) {
    console.error('Error deleting employee:', error.message);
  }
}

main();
