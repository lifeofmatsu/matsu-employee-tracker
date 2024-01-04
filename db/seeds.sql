-- Company departments
INSERT INTO department (name) VALUES 
    ('Engineering'), 
    ('Executive Management'),
    ('Finance'),
    ('Human Resources'),
    ('Legal'),
    ('Marketing & Sales');

-- Sample roles referenced to department
INSERT INTO role (title, salary, department_id) VALUES
    ('Chief Technology Officer', 375000, 1),
    ('Engineering Director', 205000, 1),
    ('Engineering Lead', 182500, 1),
    ('Senior Software Engineer', 155000, 1),
    ('Junior Software Engineer', 105000, 1),
    ('Chief Executive Officer', 447500, 2),
    ('Chief Financial Officer', 330000, 3),
    ('Finance Director', 135000, 3),
    ('Accounting Lead', 80000, 3),
    ('Financial Analyst' 75000, 3),
    ('Accounting Clerk', 45000, 3),
    ('Chief Human Resources Manager', 126500, 4),
    ('HR Director', 93000, 4),
    ('HR Manager', 75000, 4),
    ('HR Analyst', 62000, 4),
    ('Payroll Assistant' 45000, 3),
    ('HR Associate', 37500, 4),
    ('Chief Legal Officer', 121400, 5),
    ('Lawyer - Corporate', 98000, 5),
    ('Lawyer - Litigation', 99000, 5),
    ('Lawyer - Associate', 86000, 5),
    ('Paralegal', 71000, 5),
    ('Chief Marketing Officer', 135000, 6),
    ('Product Marketing Manager', 114000, 6),
    ('Sales Lead', 80000, 6),
    ('Sales Representative', 60000, 6),
    ('Marketing Representative', 55000, 6),
    ('Social Media Coordinator', 37500, 6);

-- Sample employees referenced to manager
INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES
    ('Albert', 'Einstein', 1, NULL),
    ('Thomas', 'Edison', 2, 1),
    ('Isaac', 'Newton', 3, 2),
    ('Nicola', 'Tesla', 4, 3),
    ('Robbie', 'Snellman', 5, 3),
    ('Napoleon', 'Bonaparte', 6, NULL),
    ('Alexander', 'Basileus', 7, NULL),
    ('William', 'Shakespeare', 8, 7),
    ('Abraham', 'Lincoln', 9, 8),
    ('George', 'Washington', 10, 9),
    ('Thomas', 'Jefferson', 11, 9),
    ('Charles', 'Darwin', 12, NULL),
    ('Karl', 'Marx', 13, 12),
    ('Julius', 'Caeser', 14, 13),
    ('Martin', 'Luther', 15, 14),
    ('Christopher', 'Columbus', 16, 14),
    ('Theodore', 'Roosevelt', 17, 14),
    ('Augustus', 'Caesar', 18, NULL),
    ('Ulysses', 'Grant', 19, 18),
    ('Carl', 'Linnaeus', 20, 18),
    ('Ronald', 'Reagan', 21, 19),
    ('Charles', 'Dickens', 22, 21),
    ('Genghis', 'Khan', 23, NULL),
    ('Winston', 'Churchill', 24, 23),
    ('Sigmund', 'Freud', 25, 24),
    ('Alexander', 'Hamilton', 26, 25),
    ('Amadeus', 'Mozart', 27, 25),
    ('Immanuel', 'Kant', 28, 25);





