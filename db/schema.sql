-- Table of departments
CREATE TABLE department (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL
);

-- Table of staff titles (occupation = ROLE)
CREATE TABLE occupation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(30) NOT NULL,
    salary DECIMAL NOT NULL,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES department(id)
);

-- Table of employees
CREATE TABLE employee (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    occupation_id INT,
    manager_id INT,
    FOREIGN KEY (occupation_id) REFERENCES occupation(id),
    FOREIGN KEY (manager_id) REFERENCES employee(id)
);
