-- Insert Departments
INSERT INTO departments (name)
VALUES ('Engineering'),
       ('Sales'),
       ('Marketing'),
       ('Finance');

-- Insert Roles
INSERT INTO roles (title, salary, department_id)
VALUES ('Software Engineer', 120000.00, 1),
       ('Senior Software Engineer', 150000.00, 1),
       ('Sales Representative', 80000.00, 2),
       ('Sales Manager', 100000.00, 2),
       ('Marketing Coordinator', 60000.00, 3),
       ('Marketing Manager', 85000.00, 3),
       ('Accountant', 75000.00, 4),
       ('Financial Analyst', 90000.00, 4);

-- Insert Employees (Note: We add the manager later to avoid foreign key conflicts)
INSERT INTO employees (first_name, last_name, role_id, manager_id)
VALUES ('John', 'Doe', 1, NULL), 
       ('Jane', 'Smith', 2, NULL),
       ('Mike', 'Johnson', 3, NULL),
       ('Emily', 'Brown', 4, NULL),
       ('Sarah', 'Davis', 5, NULL),
       ('David', 'Wilson', 6, NULL),
       ('Olivia', 'Taylor', 7, NULL),
       ('Daniel', 'Anderson', 8, NULL);

-- Update employees with their managers (after all employees are added)
UPDATE employees 
SET manager_id = 2 -- Jane Smith (Senior Software Engineer) becomes manager
WHERE id IN (1, 3); -- John Doe & Mike Johnson report to Jane

UPDATE employees
SET manager_id = 4 -- Emily Brown (Sales Manager) becomes manager
WHERE id IN (5, 7); -- Sarah Davis & Olivia Taylor report to Emily
