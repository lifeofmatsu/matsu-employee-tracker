const inquirer = require('inquirer');
const db = require('./db');

// Prompts user selection
const userPrompt = () => {
     return inquirer.prompt([
        {
            type: 'list',
            name: 'actions',
            message: 'Select an action from the options below:',
            choices: [
                'View ALL Departments',
                'View ALL Occupations',
                'View ALL Employees',
                'View Employees by Department',
                'View Employees by Manager',
                'View Departmental Budget Report',
                'Add New Department',
                'Add New Occupation',
                'Add New Employee',
                'Update Employee Occupation',
                'Update Employee Manager',
                'Remove Department',
                'Remove Occupation',
                'Remove Employee',
                'Exit'
            ]
        }
     ]);
}

// Fetches a list of all departments
const getDepartments = async () => {
    try {
        const [departments] = await db.promise().query(`SELECT * FROM department`);

        console.log('\n\nCatelog of Departments at OOO Software Company:\n');
        console.table(departments);
        console.log('\n');
    } catch (err) {
        console.log('Error: Failed to fetch departments', err);
    }
}

// Fetches all the occupations across all departments
const getOccupations = async () => {
    try {
        const [occupations] = await db.promise().query(
            `SELECT occupation.id, occupation.title, department.name AS department, occupation.salary
             FROM occupation
             JOIN department ON occupation.department_id = department.id`);

        console.log('\n\nCatelog of Occupations for ALL Departments:\n');
        console.table(occupations);
        console.log('\n');
    } catch (err) {
        console.error('Error: Failed to fetch occupations', err);
    }
};

// Fetches all the currently employed staff members
const getEmployees = async () => {
    try {
        const [employees] = await db.promise().query(
            `SELECT employee.id, employee.first_name, employee.last_name, occupation.title AS occupation,
                 department.name AS department, occupation.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager
             FROM employee 
             LEFT JOIN occupation ON employee.occupation_id = occupation.id
             LEFT JOIN department ON occupation.department_id = department.id
             LEFT JOIN employee AS manager ON employee.manager_id = manager.id`);

        console.log('\n\nCatelog of Employees for ALL Departments:\n');
        console.table(employees);
        console.log('\n');
    } catch (err) {
        console.error('Error: Failed to fetch employee data', err);
    }
};

/*
[BONUS ITEM] 
Fetches employees belonging to a specific department
*/
const getEmployeesByDept = async () => {
    try {
        const [departments] = await db.promise().query('SELECT id, name FROM department');
        const departmentList = departments.map(dept => ({ name: dept.name, value: dept.id }));

        const { departmentId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'departmentId',
                message: 'Select a department to list its personnel:',
                choices: departmentList
            },
        ]);

        const [employees] = await db.promise().query(
            `SELECT employee.id, employee.first_name, employee.last_name, occupation.title, department.name AS department
             FROM employee 
             JOIN occupation ON employee.occupation_id = occupation.id 
             JOIN department ON occupation.department_id = department.id 
             WHERE department.id = ?`, [departmentId]);

        const userSelection = departmentList.find(dept => dept.value === departmentId).name; // User department selection
        
        console.log(`\n\nTable of Employees in the [${userSelection}] Department:\n`);
        console.table(employees);
        console.log('\n');
    } catch (err) {
        console.error('Error: Failed to fetch employees by department:', err);
    }
}

/*
[BONUS ITEM]
Fetches the employees that report to a specific manager
*/
const getEmployeesbyMgr = async () => {
    try {
        const [managers] = await db.promise().query(
            `SELECT DISTINCT manager.id, manager.first_name, manager.last_name 
             FROM employee 
             JOIN employee AS manager ON employee.manager_id = manager.id`);
        const managerList = managers.map(mgr => ({ name: `${mgr.first_name} ${mgr.last_name}`, value: mgr.id }));

        const { managerId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'managerId',
                message: 'Select a manager to view their employees:',
                choices: managerList
            },
        ]);

        // Query employees that report to the selected manager
        const [directReports] = await db.promise().query(
            `SELECT employee.id, employee.first_name, employee.last_name, occupation.title, department.name AS department
             FROM employee
             JOIN occupation ON employee.occupation_id = occupation.id
             JOIN department ON occupation.department_id = department.id
             WHERE employee.manager_id = ?`, [managerId]);

        const userSelection = managerList.find(mgr => mgr.value === managerId).name; // User manager selection

        console.log(`\n\nTable of Employees, Direct Reports to Manager [${userSelection}]:\n`);
        console.table(directReports);
        console.log('\n');
    } catch (err) {
        console.error('Error: Failed to fetch the direct reports of user-selected manager:', err);
    }
};

/*
[BONUS ITEM]
Calculates the total utilized budgets for each department
Displays report as a table
*/
const getBudgetReport = async () => {
    try {
        // Calculate total departmental salaries
        const [budgets] = await db.promise().query(
            `SELECT department.name AS department, SUM(occupation.salary) AS total_budget
             FROM employee
             JOIN occupation ON employee.occupation_id = occupation.id
             JOIN department ON occupation.department_id = department.id
             GROUP BY department.id`);

        // Check if any data is returned
        if (budgets.length === 0) {
            console.log('No budget data available.');
            return;
        }

        console.log('\n\nTable of Total Utilized Budgets by Department:\n');
        console.table(budgets);
        console.log('\n');
    } catch (err) {
        console.error('Error: Failed to generate departmental budget report:', err);
    }
}

// Adds a new department
const addDepartment = async () => {
    try {
        const { departmentId } = await inquirer.prompt([
            {
                type: 'input',
                name: 'departmentId',
                message: 'Enter the department name:'
            }
        ]);

        await db.promise().query(`INSERT INTO department (name) VALUES (?)`, [departmentId]);

        const userEntry = departmentId.name;

        console.log(`\nThe [${userEntry}] department has been added.\n`); // User entry for 'department name'
    } catch (err) {
         console.error('Error: Failed to add department', err);
    }
}

// Adds a new occupation
const addOccupation = async () => {
    try {
        const [departments] = await db.promise().query('SELECT id, name FROM department');
        const departmentList = departments.map(dept => ({ name: dept.name, value: dept.id }));

        const userVals = await inquirer.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Enter the occupation name:'
            },
            {
                type: 'input',
                name: 'salary',
                message: 'Enter the salary for this occupation:'
            },
            {
                type: 'list',
                name: 'departmentId',
                message: 'Select the department for this occupation:',
                choices: departmentList
            }
        ]);

        await db.promise().query(
            `INSERT INTO occupation (title, salary, department_id) VALUES (?, ?, ?)`,
             [userVals.title, userVals.salary, userVals.departmentId]);

        const userSelection = departmentList.find(dept => dept.value === userVals.departmentId).name; // User 'department' selection

        console.log(`\nThe occupation [${userVals.title}] is now listed under the [${userSelection}] department.\n`);
    } catch (err) {
        console.error('Error: Failed to add occupation', err);
    }
}

// Adds a new employee
const addEmployee = async () => {
    try {
        const [occupations] = await db.promise().query('SELECT id, title FROM occupation');
        const occupationList = occupations.map(occ => ({ name: occ.title, value: occ.id }));

        const [managers] = await db.promise().query(
            `SELECT DISTINCT manager.id, manager.first_name, manager.last_name 
             FROM employee 
             JOIN employee AS manager ON employee.manager_id = manager.id`);
        const managerList = managers.map(mgr => ({ name: `${mgr.first_name} ${mgr.last_name}`, value: mgr.id }));
 
        const userVals = await inquirer.prompt([
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
                type: 'list',
                name: 'occupationId',
                message: `Select the employee's occupation:`,
                choices: occupationList 
            },
            {
                type: 'list',
                name: 'managerId',
                message: `Select the employee's direct manager:`,
                choices: managerList 
            }
        ]);

        await db.promise().query(
            `INSERT INTO employee (first_name, last_name, occupation_id, manager_id) VALUES (?, ?, ?, ?)`,
             [userVals.firstName, userVals.lastName, userVals.occupationId, userVals.managerId]);
        
        const userSelection = occupationList.find(occ => occ.value === userVals.occupationId).name; // User 'occupation' selection

        console.log(`\n[${userVals.firstName} ${userVals.lastName} (${userSelection})] has been added to payroll.\n`);
    } catch (err) {
        console.error('Error: Failed to add employee', err);
    }
}

// Modifies an employee's occupation
const setOccupation = async () => {
    try {
        const [employees] = await db.promise().query('SELECT id, first_name, last_name FROM employee');
        const employeeList = employees.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }));

        const [occupations] = await db.promise().query('SELECT id, title FROM occupation');
        const occupationList = occupations.map(occ => ({ name: occ.title, value: occ.id }));

        const userVals = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Select an employee to update:',
                choices: employeeList
            },
            {
                type: 'list',
                name: 'occupationId',
                message: 'Select new occupation:',
                choices: occupationList
            }
        ]);

        await db.promise().query(`UPDATE employee SET occupation_id = ? WHERE id = ?`, [userVals.occupationId, userVals.employeeId]);
        
        // User 'employee' & 'occupation' selections
        const selectedEmp = employeeList.find(emp => emp.value === userVals.employeeId).name;
        const selectedOcc = occupationList.find(occ => occ.value === userVals.occupationId).name;

        console.log(`\n[${selectedEmp}]'s occupation has been changed to [${selectedOcc}].\n`);
    } catch (err) {
        console.error(`Error: Failed to update the employee's occupation`, err);
    }
}

/*
[BONUS ITEM]
Updates an employee's manager
*/
const setManager = async () => {
    try {
        const [employees] = await db.promise().query('SELECT id, first_name, last_name FROM employee');
        const employeeList = employees.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }));

        const [managers] = await db.promise().query(
            `SELECT DISTINCT manager.id, manager.first_name, manager.last_name 
             FROM employee 
             JOIN employee AS manager ON employee.manager_id = manager.id`);
        const managerList = managers.map(mgr => ({ name: `${mgr.first_name} ${mgr.last_name}`, value: mgr.id }));
        managerList.unshift({name: 'No Manager', value: null}); // in case of no manager

        const userVals = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Select an employee:',
                choices: employeeList
            },
            {
                type: 'list',
                name: 'managerId',
                message: 'Select new manager:',
                choices: managerList
            }
        ]);

        await db.promise().query('UPDATE employee SET manager_id = ? WHERE id = ?', [userVals.managerId, userVals.employeeId]); // update new manager name

        // User 'employee' & 'manager' selections
        const selectedEmp = employeeList.find(emp => emp.value === userVals.employeeId).name;
        const selectedMgr = managerList.find(mgr => mgr.value === userVals.managerId).name;
         
        console.log(`\n[${selectedEmp}] is employed under manager [${selectedMgr}].\n`);
    } catch(err) {
        console.error('Error: Failed to update manager for the selected employee', err);
    }
}

/*
[BONUS ITEM]
Removes a department from the database
Removes all occupations within the department
Moves employees within the department to the `former_employees` table
*/
const removeDepartment = async () => {
    try {
        // Fetch all departments
        const [departments] = await db.promise().query('SELECT id, name FROM department');
        const departmentList = departments.map(dept => ({ name: dept.name, value: dept.id }));

        const { departmentId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'departmentId',
                message: 'Select a department to remove:',
                choices: departmentList
            }
        ]);

        // Move affected employees to the former_employees table
        await db.promise().query(
            `INSERT INTO former_employees (first_name, last_name, ...)
             SELECT first_name, last_name, ... 
             FROM employee
             JOIN occupation ON employee.occupation_id = occupation.id 
             WHERE occupation.department_id = ?`, [departmentId]);

        // Delete affected employees
        await db.promise().query(
            `DELETE employee
             FROM employee
             JOIN occupation ON employee.occupation_id = occupation.id 
             WHERE occupation.department_id = ?`, [departmentId]);

        await db.promise().query('DELETE FROM occupation WHERE department_id = ?', [departmentId]);       
        await db.promise().query('DELETE FROM department WHERE id = ?', [departmentId]);
        
        const userSelection = departmentList.find(dept => dept.value === departmentId).name; // User 'department' selection

        console.log(`\nThe [${userSelection}] department has been removed.\n All [${userSelection}] personnel have been dismissed.\n`);
    } catch (err) {
        console.error('Error: Failed to remove the selected department', err);
    }
}

/*
[BONUS ITEM]
Removes an occupation from the database
Moves employees of that occupation to the `former_employees` table
*/
const removeOccupation = async () => {
    try {
        const [occupations] = await db.promise().query('SELECT id, title FROM occupation');
        const occupationList = occupations.map(occ => ({ name: occ.title, value: occ.id }));

        const { occupationId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'occupationId',
                message: 'Select an occupation to remove:',
                choices: occupationList
            }
        ]);

        // Move affected employees to the former_employees table
        await db.promise().query(
            `INSERT INTO former_employees (first_name, last_name, ...)
             SELECT first_name, last_name, ... 
             FROM employee 
             WHERE occupation_id = ?`, [occupationId]);
        
        await db.promise().query('DELETE FROM employee WHERE occupation_id = ?', [occupationId]);
        await db.promise().query('DELETE FROM occupation WHERE id = ?', [occupationId]);
        
        const userSelection = occupationList.find(occ => occ.value === occupationId).name; // User 'occupation' selection

        console.log(`\nThe [${userSelection}] occupation has been removed.\n All [${userSelection}] personnel have been dismissed.\n`);
    } catch (err) {
        console.error('Error: Failed to remove the selected occupation', err);
    }
}

/*
[BONUS ITEM]
Removes an employee from the database
Updates `manager_id` to NULL for any direct reports of the employee
Moves the employee to the `former_employees` table
*/
const removeEmployee = async () => {
    try {
        const [employees] = await db.promise().query('SELECT id, first_name, last_name FROM employee');
        const employeeList = employees.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }));

        const { employeeId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Select an employee to remove:',
                choices: employeeList
            }
        ]);

        // Update direct reports' manager_id to NULL
        await db.promise().query('UPDATE employee SET manager_id = NULL WHERE manager_id = ?', [employeeId]);

        // Move the employee to the former_employees table
        await db.promise().query(
            `INSERT INTO former_employees (first_name, last_name, ...)
             SELECT first_name, last_name, ... 
             FROM employee 
             WHERE id = ?`, [employeeId]);

        await db.promise().query('DELETE FROM employee WHERE id = ?', [employeeId]);
        
        const userSelection = employeeList.find(emp => emp.value === employeeId).name; // User 'employee' selection

        console.log(`\nEmployee [${userSelection}] has been removed.\n`);
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
            case 'View ALL Departments':
                await getDepartments();
                break;
            case 'View ALL Occupations':
                await getOccupations();
                break;
            case 'View ALL Employees':
                await getEmployees();
                break;
            case 'View Employees by Department':
                await getEmployeesByDept();
                break;
            case 'View Employees by Manager':
                await getEmployeesbyMgr();
                break;
            case 'View Departmental Budget Report':
                await getBudgetReport();
                break;
            case 'Add New Department':
                await addDepartment();
                break;
            case 'Add New Occupation':
                await addOccupation();
                break;
            case 'Add New Employee':
                await addEmployee();
                break;
            case 'Update Employee Occupation':
                await setOccupation();
                break;
            case 'Update Employee Manager':
                await setManager();
                break;
            case 'Remove Department': 
                await removeDepartment();
                break;
            case 'Remove Occupation': 
                await removeOccupation();
                break;
            case 'Remove Employee':
                await removeEmployee();
                break;
            case 'Exit':
                console.log('Exiting application.');
                db.end(); // Close database connection
                exit = true;
                break;
            default:
                console.log('Action not recognized. Please try again.');
                break;
        }        
    }
}

main().catch(err => console.error(err));