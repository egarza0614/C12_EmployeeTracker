DROP DATABASE IF EXISTS employeetracker_db;
CREATE DATABASE employeetracker_db;

\c employeetracker_db;

CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(30) NOT NULL,
  salary DECIMAL(10,2) NOT NULL,
  department_id INT REFERENCES departments(id)
);

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(30) NOT NULL,
  last_name VARCHAR(30) NOT NULL,
  role_id INT REFERENCES roles(id),
  manager_id INT REFERENCES employees(id)
);