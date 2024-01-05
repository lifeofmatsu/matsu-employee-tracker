const inquirer = require('inquirer');
const db = require('./db');

// Prompts user selection
const userPrompt = () => {
     return inquirer.prompt([
        {
            type: 'list',
            name: 'actions',
            message: 'Select an action you would like to take:',
            choices: [
                'Get List of Departments',
                'Get List of Occupations',
                'Get List of Personnel',
                'Get Personnel by Department', // bonus
                'Get Direct Reports by Manager', // bonus
                'Generate Departmental Budget Report', // bonus
                'Add New Department',
                'Add New Occupation',
                'Add New Staff Personnel',
                'Edit Staff Department', // extra
                'Edit Staff Occupation',
                'Edit Reporting Manager', // bonus
                'Remove Department', // bonus
                'Remove Occupation', // bonus
                'Remove Staff Personnel', // bonus
                'Exit'
            ]
        }
     ]);
}

// Gets list of departments
const getDepts = async () => {
    try {
        const query = `SELECT * FROM department`;
        const [rows] = await db.promise().query(query);

        console.log('\n');
        console.table(rows);
        console.log('\n');
    } catch (err) {
        console.log('Error: Failed to fetch departments', err);
    }
}

// Gets list of occupations
const getOccupations = async () => {
    try {
        const query = `
            SELECT occupation.id, occupation.title, department.name AS department, occupation.salary
            FROM occupation
            JOIN department ON occupation.department_id = department.id`;
        const [rows] = await db.promise().query(query);

        console.log('\n');
        console.table(rows);
        console.log('\n');
    } catch (err) {
        console.error('Error: Failed to fetch occupations', err);
    }
};

// Gets list of personnel
const getEmployees = async () => {
    try {
        const query = `
            SELECT employee.id, employee.first_name, employee.last_name, 
                occupation.title AS occupation_title, 
                department.name AS department, 
                occupation.salary, 
                CONCAT(manager.first_name, ' ', manager.last_name) AS manager_name
            FROM employee
            LEFT JOIN occupation ON employee.occupation_id = occupation.id
            LEFT JOIN department ON occupation.department_id = department.id
            LEFT JOIN employee AS manager ON employee.manager_id = manager.id`;

        const [rows] = await db.promise().query(query);

        console.log('\n');
        console.table(rows);
        console.log('\n');
    } catch (err) {
        console.error('Error: Failed to fetch employee data', err);
    }
};

// BONUS: Gets employees of a specific department
const getEmployeesByDept = async () => {
    try {
        // Query array of depts; user selects dept
        const [departments] = await db.promise().query('SELECT id, name FROM department');

        const departmentList = departments.map(dept => ({
            name: dept.name,
            value: dept.id
        }));

        const { departmentId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'departmentId',
                message: 'Select a department to list its personnel:',
                choices: departmentList
            },
        ]);

        // Query personnel for selected dept
        const query = `
            SELECT employee.id, employee.first_name, employee.last_name, occupation.title, department.name AS department
            FROM employee
            JOIN occupation ON employee.occupation_id = occupation.id
            JOIN department ON occupation.department_id = department.id
            WHERE department.id = ?
        `;
        const [employees] = await db.promise().query(query, [departmentId]);
        
        console.log('\n');
        console.table(employees);
        console.log('\n');
    } catch (err) {
        console.error('Error: Failed to fetch employees by department:', err);
    }
}

// BONUS: Gets the direct reports of a manager
const getEmployeesByMgr = async () => {
    try {
        // Query array of managers; user selects manager
        const [managers] = await db.promise().query('SELECT id, first_name, last_name FROM employee WHERE manager_id IS NOT NULL');
        const { managerId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'managerId',
                message: 'Select a manager to list their direct reports:',
                choices: managers.map(mgr => ({ name: `${mgr.first_name} ${mgr.last_name}`, value: mgr.id })),
            },
        ]);

        // Query direct reports for selected manager
        const query = `
            SELECT employee.id, employee.first_name, employee.last_name, occupation.title, department.name AS department
            FROM employee
            JOIN occupation ON employee.occupation_id = occupation.id
            JOIN department ON occupation.department_id = department.id
            WHERE employee.manager_id = ?
        `;
        const [employees] = await db.promise().query(query, [managerId]);

        console.log('\n');
        console.table(employees);
        console.log('\n');
    } catch (err) {
        console.error('Error: Failed to fetch the direct reports of user-selected manager:', err);
    }
}

// BONUS: Generates departmental budget report (i.e. combined payroll salaries by dept)
const getBudgetReport = async () => {
    try {
        // Calculate total budget for each dept
        const query = `
            SELECT department.name AS Department, SUM(occupation.salary) AS TotalBudget
            FROM employee
            JOIN occupation ON employee.occupation_id = occupation.id
            JOIN department ON occupation.department_id = department.id
            GROUP BY department.id
        `;
        const [budgets] = await db.promise().query(query);

        // Check if any data is returned
        if (budgets.length === 0) {
            console.log('No budget data available.');
            return;
        }

        console.log('\n');
        console.table(budgets);
        console.log('\n');
    } catch (err) {
        console.error('Error: Failed to generate departmental budget report:', err);
    }
}

// Adds new department
const addDept = async () => {
    try {
        const deptVals = await inquirer.prompt([
            {
                type: 'input',
                name: 'department',
                message: 'Enter department name:'
            }
        ]);

        const insertQuery = `INSERT INTO department (name) VALUES (?)`;
        await db.promise().query(insertQuery, [deptVals.department]);

        console.log('Department added successfully.')
    } catch (err) {
         console.error('Error: Failed to add department', err);
    }
}

// Adds new occupation
const addOccupation = async () => {
    try {
        const occupations = await inquirer.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Enter occupation name:'
            },
            {
                type: 'input',
                name: 'salary',
                message: 'Enter the salary for this occupation:'
            },
            {
                type: 'input',
                name: 'departmentId',
                message: 'Enter the department for this occupation:'
            }
        ]);

        const insertQuery = `INSERT INTO occupation (title, salary, department_id) VALUES (?, ?, ?)`;
        await db.promise().query(insertQuery, [occupations.title, occupations.salary, occupations.departmentId]);

        console.log('Occupation added successfully.');
    } catch (err) {
        console.error('Error: Failed to add occupation', err);
    }
}

// Adds new employees
const addEmployee = async () => {
    try {
        const employee = await inquirer.prompt([
            {
                type: 'input',
                name: 'firstName',
                message: `Enter the employee's first name:`
            },
            {
                type: 'input',
                name: 'lastName',
                message: `Enter the employee's last name:`
            },
            {
                type: 'input',
                name: 'occupationId',
                message: `Enter the employee's occupation:`
            },
            {
                type: 'input',
                name: 'managerId',
                message: `Enter the employee's reporting manager (NULL if not applicable):`
            }
        ]);

        const insertQuery = `INSERT INTO employee (first_name, last_name, occupation_id, manager_id) VALUES (?, ?, ?, ?)`;
        await db.promise().query(insertQuery, [employee.firstName, employee.lastName, employee.occupationId, employee.managerId]);
        
        console.log('New employee added successfully.');
    } catch (err) {
        console.error('Error: Failed to add employee', err);
    }
}

// EXTRA: Edits department for a staff member
const setDept = async () => {
    try {
        const employees = await getEmployees();
        const departments = await getDepts();

        const setVals = await inquirer.prompt([
            {
                type: 'list',
                name: 'employee',
                message: 'Select an employee to update:',
                choices: employees // array of employees
            },
            {
                type: 'list',
                name: 'departmentId',
                message: 'Select new department:',
                choices: departments // array of departments
            }
        ]);

        const updateQuery = `UPDATE employee SET department_id = ? WHERE id = ?`;
        await db.promise().query(updateQuery, [setVals.departmentId, setVals.employee]); 
        
        console.log(`The employee's department has been updated successfully`);
    } catch (err) {
        console.error(`Error: Failed to update the employee's department`, err);
    }
}

// Sets occupation for a staff member
const setOccupation = async () => {
    try {
        const employees = await getEmployees();
        const occupations = await getOccupations();

        const setVals = await inquirer.prompt([
            {
                type: 'list',
                name: 'employee',
                message: 'Select an employee to update:',
                choices: employees // array of employees
            },
            {
                type: 'list',
                name: 'occupationId',
                message: 'Select new occupation:',
                choices: occupations // array of occupations
            }
        ]);

        const updateQuery = `UPDATE employee SET occupation_id = ? WHERE id = ?`;
        await db.promise().query(updateQuery, [setVals.occupationId, setVals.employee]);

        console.log(`The employee's occupation has been updated successfully.`);
    } catch (err) {
        console.error(`Error: Failed to update the employee's occupation`, err);
    }
}

// BONUS: Sets the reporting manager for a staff member
const setMgr = async () => {
    try {
        const [employees] = await db.promise().query('SELECT id, first_name, last_name FROM employee');

        const staffList = employees.map(staff => ({
            name: `${staff.first_name} ${staff.last_name}`,
            value: staff.id
        }));

        const { employeeId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Select an employee to update their manager:',
                choices: staffList
            }
        ]);

        const [managers] = await db.promise().query('SELECT id, first_name, last_name FROM employee WHERE id != ?', [employeeId]);

        const managerList = managers.map(mgr => ({
            name: `${mgr.first_name} ${mgr.last_name}`,
            value: mgr.id
        }));

        managerList.unshift({name: 'No Manager', value: null}); // Case for no manager

        const { newManagerId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'newManagerId',
                message: 'Select the new manager:',
                choices: managerList
            }
        ]);

        const updateQuery = 'UPDATE employee SET manager_id = ? WHERE id = ?';
        await db.promise().query(updateQuery, [newManagerId, employeeId]);''
         
        console.log('Manager updated successfully for the selected employee');
    } catch(err) {
        console.error('Error: Failed to update manager for the selected employee', err);
    }
}

// BONUS: Removes an existing department
const removeDept = async () => {
    try {
        // Fetch all departments
        const [departments] = await db.promise().query('SELECT id, name FROM department');

        const departmentList = departments.map(dept => ({
            name: dept.name,
            value: dept.id
        }));

        const { departmentId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'departmentId',
                message: 'Select a department to remove:',
                choices: departmentList
            }
        ]);

        // Delete the selected department
        const deleteQuery = 'DELETE FROM department WHERE id = ?';
        await db.promise().query(deleteQuery, [departmentId]);

        console.log('Department removed successfully.');
    } catch (err) {
        console.error('Error: Failed to remove the selected department', err);
    }
}

// BONUS: Removes an existing occupation
const removeOccupation = async () => {
    try {
        const [occupations] = await db.promise().query('SELECT id, title FROM occupation');

        const occupationList = occupations.map(role => ({
            name: role.title,
            value: role.id
        }));

        const { occupationId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'occupationId',
                message: 'Select an occupation to remove:',
                choices: occupationList
            }
        ]);

        const removeQuery = 'DELETE FROM occupation WHERE id = ?';
        await db.promise().query(removeQuery, [occupationId]);

        console.log('Occupation removed successfully');
    } catch (err) {
        console.error('Error: Failed to remove the selected occupation', err);
    }
}

// BONUS: Removes an existing staff member
const removeEmployee = async () => {
    try {
        const [employees] = await db.promise().query('SELECT id, first_name, last_name FROM employee');

        const staffList = employees.map(staff => ({
            name: `${staff.first_name} ${staff.last_name}`,
            value: staff.id
        }));

        const { employeeId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Select an employee to remove:',
                choices: staffList
            }
        ]);

        const removeQuery = 'DELETE FROM employee WHERE id = ?';
        await db.promise().query(removeQuery, [employeeId]);

        console.log('Employee removed successfully');
    } catch(err) {
        console.error('Error: Failed to remove the selected staff member', err);
    }
}

// Initalize application
const main = async () => {
    let exit = false;
    while (!exit) {
        const input = await userPrompt();
        switch (input.actions) {
            case 'Get List of Departments':
                await getDepts();
                break;
            case 'Get List of Occupations':
                await getOccupations();
                break;
            case 'Get List of Personnel':
                await getEmployees();
                break;
            case 'Get Personnel by Department':
                await getEmployeesByDept();
                break;
            case 'Get Direct Reports by Manager':
                await getEmployeesByMgr();
                break;
            case 'Generate Departmental Budget Report':
                await getBudgetReport();
                break;
            case 'Add New Department':
                await addDept();
                break;
            case 'Add New Occupation':
                await addOccupation();
                break;
            case 'Add New Staff Personnel':
                await addEmployee();
                break;
            case 'Edit Staff Department':
                await setDept();
                break;
            case 'Edit Staff Occupation':
                await setOccupation();
                break;
            case 'Edit Reporting Manager':
                await setMgr();
                break;
            case 'Remove Department': 
                await removeDept();
                break;
            case 'Remove Occupation': 
                await removeOccupation();
                break;
            case 'Remove Staff Personnel':
                await removeEmployee();
                break;
            case 'Exit':
                console.log('Exiting application.');
                db.end(); // Close database connection
                exit = true;
                break;
            default:
                console.log('Action not recognized');
                break;
        }        
    }
}

main().catch(err => console.error(err));