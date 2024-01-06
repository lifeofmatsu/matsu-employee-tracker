const inquirer = require('inquirer');
const db = require('./db');

// Prompts user selection
const userPrompt = () => {
     return inquirer.prompt([
        {
            type: 'list',
            name: 'actions',
            message: 'Select a desired command from the options below:',
            choices: [
                'View a List of All Departments',
                'View a List of All Occupations',
                'View a List of All Employees',
                'View a List of Employees from a specified Department', // bonus
                'View a List of Employees under a specified Manager', // bonus
                'View the Total Utilized Budgets of Each Department', // bonus
                'Add a New Department',
                'Add a New Occupation',
                'Add a New Employee',
                `Reassign an Employee's Department`, // extra
                `Reassign an Employee's Occupation`,
                `Reassign an Employee's Manager`, // bonus
                'Remove an Existing Department', // bonus
                'Remove an Existing Occupation', // bonus
                'Remove an Existing Employee', // bonus
                'Exit'
            ]
        }
     ]);
}

// Displays a list of all departments
const getDepartments = async () => {
    try {
        const query = `SELECT * FROM department`;
        const [rows] = await db.promise().query(query);

        console.log('\n\nCurrent List of Departments at OOO Company:\n');
        console.table(rows);
        console.log('\n');
    } catch (err) {
        console.log('Error: Failed to fetch departments', err);
    }
}

// Displays a list of all staff positions
const getOccupations = async () => {
    try {
        const query = `
            SELECT occupation.id, occupation.title, department.name AS department, occupation.salary
            FROM occupation
            JOIN department ON occupation.department_id = department.id`;
        const [rows] = await db.promise().query(query);

        console.log('\n\nCurrent List of Occupations (Detailed):\n');
        console.table(rows);
        console.log('\n');
    } catch (err) {
        console.error('Error: Failed to fetch occupations', err);
    }
};

// Displays a list of all company personnel
const getEmployees = async () => {
    try {
        const query = `
            SELECT employee.id, employee.first_name, employee.last_name, 
                occupation.title AS occupation, 
                department.name AS department, 
                occupation.salary, 
                CONCAT(manager.first_name, ' ', manager.last_name) AS manager
            FROM employee
            LEFT JOIN occupation ON employee.occupation_id = occupation.id
            LEFT JOIN department ON occupation.department_id = department.id
            LEFT JOIN employee AS manager ON employee.manager_id = manager.id`;

        const [rows] = await db.promise().query(query);

        console.log('\n\nEmployees Currently on Payroll (Detailed):\n');
        console.table(rows);
        console.log('\n');
    } catch (err) {
        console.error('Error: Failed to fetch employee data', err);
    }
};

// (BONUS) Displays a list of employees from a specific department
const getEmployeesByDept = async () => {
    try {
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

        const query = `
            SELECT employee.id, employee.first_name, employee.last_name, occupation.title, department.name AS department
            FROM employee
            JOIN occupation ON employee.occupation_id = occupation.id
            JOIN department ON occupation.department_id = department.id
            WHERE department.id = ?
        `;
        const [employees] = await db.promise().query(query, [departmentId]);

        const selectedDept = departmentList.find(dept => dept.value === departmentId).name;
        
        console.log(`\n\nEmployees in the ${selectedDept} Department:\n`);
        console.table(employees);
        console.log('\n');
    } catch (err) {
        console.error('Error: Failed to fetch employees by department:', err);
    }
}

// (BONUS) Gets the direct reports of a specific manager
const getDirectReports = async () => {
    try {
        const [managers] = await db.promise().query(
            `SELECT DISTINCT manager.id, manager.first_name, manager.last_name 
             FROM employee 
             JOIN employee AS manager ON employee.manager_id = manager.id`
        );

        const managerList = managers.map(mgr => ({
            name: `${mgr.first_name} ${mgr.last_name}`,
            value: mgr.id
        }));

        const { managerId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'managerId',
                message: 'Select a manager to list their employees:',
                choices: managerList
            },
        ]);

        // Query employees that report to the selected manager
        const query = `
            SELECT employee.id, employee.first_name, employee.last_name, occupation.title, department.name AS department
            FROM employee
            JOIN occupation ON employee.occupation_id = occupation.id
            JOIN department ON occupation.department_id = department.id
            WHERE employee.manager_id = ?`;

        const [employees] = await db.promise().query(query, [managerId]);

         // get the manager that user selected
         const selectedMgr = managers.find(mgr => mgr.id === managerId);
         const managerName = `${selectedMgr.first_name} ${selectedMgr.last_name}`; 

        console.log(`\n\nThe following employees report to ${managerName}:\n`);
        console.table(employees);
        console.log('\n');
    } catch (err) {
        console.error('Error: Failed to fetch the direct reports of user-selected manager:', err);
    }
};

// (BONUS) Displays the total utilized budgets for each department
const getBudgetReport = async () => {
    try {
        // Calculate total departmental salaries
        const query = `
            SELECT department.name AS department, SUM(occupation.salary) AS total_budget
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

        console.log('\n\nTotal Utilized Budget by Department:\n');
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

        const insertQuery = `INSERT INTO department (name) VALUES (?)`;
        await db.promise().query(insertQuery, [departmentId]);

        console.log(`\n\nThe [${departmentId}] department has been added.\n\n`);
    } catch (err) {
         console.error('Error: Failed to add department', err);
    }
}

// Adds a new occupation
const addOccupation = async () => {
    try {

        const [departments] = await db.promise().query('SELECT id, name FROM department');

        const departmentList = departments.map(dept => ({
            name: dept.name,
            value: dept.id
        }));

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
                message: 'Select the department the occupation will be payrolled in:',
                choices: departmentList // array of departments
            }
        ]);

        const insertQuery = `INSERT INTO occupation (title, salary, department_id) VALUES (?, ?, ?)`;
        await db.promise().query(insertQuery, [userVals.title, userVals.salary, userVals.departmentId]);

        const selectedDept = departmentList.find(dept => dept.value === userVals.departmentId).name;

        console.log(`\n\nThe occupation [${userVals.title}] has been added to the [${selectedDept}] department.\n\n`);
    } catch (err) {
        console.error('Error: Failed to add occupation', err);
    }
}

// Adds a new employee
const addEmployee = async () => {
    try {
        const [occupations] = await db.promise().query('SELECT id, title FROM occupation');
        const [managers] = await db.promise().query(
            `SELECT DISTINCT manager.id, manager.first_name, manager.last_name 
             FROM employee 
             JOIN employee AS manager ON employee.manager_id = manager.id`
        );

        const occupationList = occupations.map(occ => ({
            name: occ.title,
            value: occ.id
        }));
        const managerList = managers.map(mgr => ({
            name: `${mgr.first_name} ${mgr.last_name}`,
            value: mgr.id
        }));

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

        const insertQuery = `INSERT INTO employee (first_name, last_name, occupation_id, manager_id) VALUES (?, ?, ?, ?)`;
        await db.promise().query(insertQuery, [userVals.firstName, userVals.lastName, userVals.occupationId, userVals.managerId]);
        
        const selectedOcc = occupationList.find(occ => occ.value === userVals.occupationId).name;

        console.log(`\n\n${userVals.firstName} ${userVals.lastName} [${selectedOcc}] has been added to payroll.\n\n`);
    } catch (err) {
        console.error('Error: Failed to add employee', err);
    }
}

// (EXTRA) Modifies an employee's assigned deparment
const setDepartment = async () => {
    try {
        const [employees] = await db.promise().query('SELECT id, first_name, last_name FROM employee');
        const [departments] = await db.promise().query('SELECT id, name FROM department');

        const employeeList = employees.map(emp => ({
            name: `${emp.first_name} ${emp.last_name}`,
            value: emp.id
        }));
        const departmentList = departments.map(dept => ({
            name: dept.name,
            value: dept.id
        }));

        const userVals = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Select the reassigned employee:',
                choices: employeeList
            },
            {
                type: 'list',
                name: 'departmentId',
                message: `Select the employee's new department:`,
                choices: departmentList
            }
        ]);

        const updateQuery = `UPDATE employee SET department_id = ? WHERE id = ?`;
        await db.promise().query(updateQuery, [userVals.departmentId, userVals.employeeId]); 

        const selectedEmp = employeeList.find(emp => emp.value === userVals.employeeId).name;
        const selectedDept = departmentList.find(dept => dept.value === userVals.departmentId).name;
        
        console.log(`Employee [${selectedEmp}] has been reassigned to the [${selectedDept}] department.`);
    } catch (err) {
        console.error(`Error: Failed to update the employee's department`, err);
    }
}

// Modifies an employee's occupation
const setOccupation = async () => {
    try {
        const [employees] = await db.promise().query('SELECT id, first_name, last_name FROM employee');
        const [occupations] = await db.promise().query('SELECT id, title FROM occupation');

        const employeeList = employees.map(emp => ({
            name: `${emp.first_name} ${emp.last_name}`,
            value: emp.id
        }));
        const occupationList = occupations.map(occ => ({
            name: occ.title,
            value: occ.id
        }));

        const userVals = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Select an employee to update:',
                choices: employeeList // array of employees
            },
            {
                type: 'list',
                name: 'occupationId',
                message: 'Select new occupation:',
                choices: occupationList // array of occupations
            }
        ]);

        const selectedEmp = employeeList.find(emp => emp.value === userVals.employeeId).name;
        const selectedOcc = occupationList.find(occ => occ.value === userVals.occupationId).name;

        const updateQuery = `UPDATE employee SET occupation_id = ? WHERE id = ?`;
        await db.promise().query(updateQuery, [userVals.occupationId, userVals.employeeId]);

        console.log(`Employee '${selectedEmp}'s occupation has been changed to: ${selectedOcc}`);
    } catch (err) {
        console.error(`Error: Failed to update the employee's occupation`, err);
    }
}

// (BONUS) Modifies an employee's reporting manager
const setManager = async () => {
    try {
        const [employees] = await db.promise().query('SELECT id, first_name, last_name FROM employee');
        const [managers] = await db.promise().query('SELECT id, first_name, last_name FROM employee WHERE id != ?');

        const employeeList = employees.map(emp => ({
            name: `${emp.first_name} ${emp.last_name}`,
            value: emp.id
        }));
        const managerList = managers.map(mgr => ({
            name: `${mgr.first_name} ${mgr.last_name}`,
            value: mgr.id
        }));
        managerList.unshift({name: 'No Manager', value: null}); // Case for no manager

        const userVals = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Select an employee to change their manager:',
                choices: employeeList //array of employees
            },
            {
                type: 'list',
                name: 'managerId',
                message: 'Select the new manager assigned to the employee:',
                choices: managerList // array of managers
            }
        ]);

        const updateQuery = 'UPDATE employee SET manager_id = ? WHERE id = ?';
        await db.promise().query(updateQuery, [userVals.managerId, userVals.employeeId]);
         
        console.log('Manager updated successfully for the selected employee');
    } catch(err) {
        console.error('Error: Failed to update manager for the selected employee', err);
    }
}

// (BONUS) Removes an existing department
const removeDepartment = async () => {
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

// (BONUS) Removes an existing occupation
const removeOccupation = async () => {
    try {
        const [occupations] = await db.promise().query('SELECT id, title FROM occupation');

        const occupationList = occupations.map(occ => ({
            name: occ.title,
            value: occ.id
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

// (BONUS) Removes an existing employee
const removeEmployee = async () => {
    try {
        const [employees] = await db.promise().query('SELECT id, first_name, last_name FROM employee');

        const employeeList = employees.map(emp => ({
            name: `${emp.first_name} ${emp.last_name}`,
            value: emp.id
        }));

        const { employeeId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Select an employee to remove:',
                choices: employeeList // array of employees
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
            case 'View a List of All Departments':
                await getDepartments();
                break;
            case 'View a List of All Occupations':
                await getOccupations();
                break;
            case 'View a List of All Employees':
                await getEmployees();
                break;
            case 'View a List of Employees from a specified Department':
                await getEmployeesByDept();
                break;
            case 'View a List of Employees under a specified Manager':
                await getDirectReports();
                break;
            case 'View the Total Utilized Budgets of Each Department':
                await getBudgetReport();
                break;
            case 'Add a New Department':
                await addDepartment();
                break;
            case 'Add a New Occupation':
                await addOccupation();
                break;
            case 'Add a New Employee':
                await addEmployee();
                break;
            case `Reassign an Employee's Department`:
                await setDepartment();
                break;
            case `Reassign an Employee's Occupation`:
                await setOccupation();
                break;
            case `Reassign an Employee's Manager`:
                await setManager();
                break;
            case 'Remove an Existing Department': 
                await removeDepartment();
                break;
            case 'Remove an Existing Occupation': 
                await removeOccupation();
                break;
            case 'Remove an Existing Employee':
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