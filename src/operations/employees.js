const inquirer = require('inquirer');
const db = require('../db');


// Fetches all the currently employed staff members
const getEmployees = async () => {
	try {
		const [employees] = await db.promise().query(
			`SELECT employee.id, employee.first_name, employee.last_name, occupation.title AS occupation,
                 department.name AS department, occupation.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager
             FROM employee 
             LEFT JOIN occupation ON employee.occupation_id = occupation.id
             LEFT JOIN department ON occupation.department_id = department.id
             LEFT JOIN employee AS manager ON employee.manager_id = manager.id`
		);

        // Formats `salary` values as currency without decimal places
        const formattedEmployees = employees.map(employee => {
            return {
                ...employee,
                salary: new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0, // No decimal places
                    maximumFractionDigits: 0, // No decimal places
                }).format(employee.salary)
            };
        });

		console.log('\n\nTable 3a. Catalog of Employees for ALL Departments:\n');
		console.table(formattedEmployees);
		console.log('\n');
	} catch (err) {
		console.error('Error: Failed to fetch employee data', err);
	}
};

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

        // Check for existing employee with the same name
        const [existingEmployee] = await db.promise().query(
            `SELECT * FROM employee WHERE first_name = ? AND last_name = ?`, 
            [userVals.firstName, userVals.lastName]
        );

        if (existingEmployee.length > 0) {
            console.log(`\nEmployee [${userVals.firstName} ${userVals.lastName}] already exists. Please verify the employee's information.\n`);
            return; // Exit the function if employee already exists
        }

        // Proceed to insert the new employee
        await db.promise().query(
            `INSERT INTO employee (first_name, last_name, occupation_id, manager_id) VALUES (?, ?, ?, ?)`,
            [userVals.firstName, userVals.lastName, userVals.occupationId, userVals.managerId]
        );

        console.log(`\nEmployee [${userVals.firstName} ${userVals.lastName}] has been added to the database.\n`);
    } catch (err) {
        console.error('Error: Failed to add employee', err);
    }
};

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

        // Assuming 'prior_occupation' needs the occupation title, which requires a JOIN to fetch
        const employeeToRemove = await db.promise().query(
            `SELECT first_name, last_name, o.title AS prior_occupation
             FROM employee e
             JOIN occupation o ON e.occupation_id = o.id
             WHERE e.id = ?`, [employeeId]);

        if (employeeToRemove[0].length > 0) {
            const { first_name, last_name, prior_occupation } = employeeToRemove[0][0];
            const laidOffDate = new Date().toISOString().slice(0, 10); // Using current date as laid off date

            await db.promise().query(
                `INSERT INTO former_employees (first_name, last_name, prior_occupation, laid_off_date)
                 VALUES (?, ?, ?, ?)`, 
                [first_name, last_name, prior_occupation, laidOffDate]);
        }

        // Now remove the employee from the employee table
        await db.promise().query('DELETE FROM employee WHERE id = ?', [employeeId]);
       
        const userSelectEmployee = employeeList.find(emp => emp.value === employeeId).name;
        console.log(`\nEmployee [${userSelectEmployee}] has been removed.\n`);
    } catch(err) {
        console.error('Error: Failed to remove the selected staff member', err);
    }
};

/*
[BONUS ITEM] 
Fetches employees belonging to a specific department
*/
const getEmployeesByDept = async () => {
	try {
		const [departments] = await db
			.promise()
			.query('SELECT id, name FROM department');
		const departmentList = departments.map((dept) => ({
			name: dept.name,
			value: dept.id
		}));

		const { departmentId } = await inquirer.prompt([
			{
				type: 'list',
				name: 'departmentId',
				message: 'Select a department to list its personnel:',
				choices: departmentList
			}
		]);

		const [employees] = await db.promise().query(
			`SELECT employee.id, employee.first_name, employee.last_name, occupation.title, department.name AS department
             FROM employee 
             JOIN occupation ON employee.occupation_id = occupation.id 
             JOIN department ON occupation.department_id = department.id 
             WHERE department.id = ?`,
			[departmentId]
		);

		const userSelectDept = departmentList.find((dept) => dept.value === departmentId).name; // User department selection
		console.log(`\n\nTable 3b. Employees in the [${userSelectDept}] department:\n`);
		console.table(employees);
		console.log('\n');
	} catch (err) {
		console.error('Error: Failed to fetch employees by department:', err);
	}
};

/*
[BONUS ITEM]
Fetches the employees that report to a specific manager
*/
const getEmployeesbyMgr = async () => {
	try {
		const [managers] = await db.promise().query(
			`SELECT DISTINCT manager.id, manager.first_name, manager.last_name 
             FROM employee 
             JOIN employee AS manager ON employee.manager_id = manager.id`
		);
		const managerList = managers.map((mgr) => ({
			name: `${mgr.first_name} ${mgr.last_name}`,
			value: mgr.id
		}));

		const { managerId } = await inquirer.prompt([
			{
				type: 'list',
				name: 'managerId',
				message: 'Select a manager to view their employees:',
				choices: managerList
			}
		]);

		// Query employees that report to the selected manager
		const [directReports] = await db.promise().query(
			`SELECT employee.id, employee.first_name, employee.last_name, occupation.title, department.name AS department
             FROM employee
             JOIN occupation ON employee.occupation_id = occupation.id
             JOIN department ON occupation.department_id = department.id
             WHERE employee.manager_id = ?`,
			[managerId]
		);

		const userSelectMgr = managerList.find((mgr) => mgr.value === managerId).name; // User manager selection
		console.log(`\n\nTable 3c. Employees Reporting Directly to Manager [${userSelectMgr}]:\n`);
		console.table(directReports);
		console.log('\n');
	} catch (err) {
		console.error('Error: Failed to fetch the direct reports of user-selected manager:', err);
	}
};

/*
[BONUS ITEM]
Updates an employee's manager
*/
const setManager = async () => {
	try {
		const [employees] = await db
			.promise()
			.query('SELECT id, first_name, last_name FROM employee');
		const employeeList = employees.map((emp) => ({
			name: `${emp.first_name} ${emp.last_name}`,
			value: emp.id
		}));

		const [managers] = await db.promise().query(
			`SELECT DISTINCT manager.id, manager.first_name, manager.last_name 
             FROM employee 
             JOIN employee AS manager ON employee.manager_id = manager.id`
		);
		const managerList = managers.map((mgr) => ({
			name: `${mgr.first_name} ${mgr.last_name}`,
			value: mgr.id
		}));
		managerList.unshift({ name: 'No Manager', value: null }); // in case of no manager

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

		await db
			.promise()
			.query('UPDATE employee SET manager_id = ? WHERE id = ?', [
				userVals.managerId,
				userVals.employeeId
			]); // update new manager name

		// User selections for employee and manager
		const userSelectEmployee = employeeList.find((emp) => emp.value === userVals.employeeId).name;
		const userSelectMgr = managerList.find((mgr) => mgr.value === userVals.managerId).name; // User manager selection

		console.log(`\n[${userSelectEmployee}] is employed under manager [${userSelectMgr}].\n`);
	} catch (err) {
		console.error('Error: Failed to update manager for the selected employee', err);
	}
};

module.exports = {
    getEmployees,
    addEmployee,
    removeEmployee,
    getEmployeesByDept,
    getEmployeesbyMgr,
    setManager
};
