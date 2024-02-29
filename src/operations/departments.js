const inquirer = require('inquirer');
const db = require('../db');


// Fetches a list of all departments
const getDepartments = async () => {
	try {
		const [departments] = await db
			.promise()
			.query(`SELECT * FROM department`);

		console.log('\n\nTable 1a. Catalog of Departments at XXX Software Company:\n');
		console.table(departments);
		console.log('\n');
	} catch (err) {
		console.log('Error: Failed to fetch departments', err);
	}
};

// Adds a new department
const addDepartment = async () => {
	try {
		const { departmentName } = await inquirer.prompt([
			{
				type: 'input',
				name: 'departmentName', // Changed from departmentId to departmentName for clarity
				message: 'Enter the department name:'
			}
		]);

		// Check for existing department name
		const [departments] = await db
			.promise()
			.query(`SELECT name FROM department WHERE name = ?`, [
				departmentName
			]);
		if (departments.length > 0) {
			console.log(
				`\nDepartment [${departmentName}] already exists. Please enter a unique department name.\n`
			);
			return; // Exit the function if department already exists
		}

		// Proceed to insert the new department if it doesn't exist
		await db
			.promise()
			.query(`INSERT INTO department (name) VALUES (?)`, [
				departmentName
			]);

		console.log(`\nThe [${departmentName}] department has been added.\n`);
	} catch (err) {
		console.error('Error: Failed to add department', err);
	}
};

/*
[BONUS ITEM]
Removes a department from the database
Removes all occupations within the department
Moves employees within the department to the `former_employees` table
*/
const removeDepartment = async () => {
    try {
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

        // Fetch employees' names, their occupation, for the department to be removed
        const employeesInDept = await db.promise().query(
            `SELECT e.first_name, e.last_name, o.title AS prior_occupation
             FROM employee e
             JOIN occupation o ON e.occupation_id = o.id
             WHERE o.department_id = ?`, [departmentId]);

        if (employeesInDept[0].length > 0) {
            employeesInDept[0].forEach(async (employee) => {
                const { first_name, last_name, prior_occupation } = employee;
                const laidOffDate = new Date().toISOString().slice(0, 10); // Using current date as laid off date

                await db.promise().query(
                    `INSERT INTO former_employees (first_name, last_name, prior_occupation, laid_off_date)
                     VALUES (?, ?, ?, ?)`, 
                    [first_name, last_name, prior_occupation, laidOffDate]);
            });
        }

        // Now, remove the occupations associated with the department
        await db.promise().query('DELETE FROM occupation WHERE department_id = ?', [departmentId]);

        // Then remove the department
        await db.promise().query('DELETE FROM department WHERE id = ?', [departmentId]);
       
        const userSelection = departmentList.find(dept => dept.value === departmentId).name;
        console.log(`\nThe [${userSelection}] department and its occupations have been removed.\n`);
    } catch(err) {
        console.error('Error: Failed to remove the selected department', err);
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
             GROUP BY department.id`
        );

        // Check if any data is returned
        if (budgets.length === 0) {
            console.log('No budget data available.');
            return;
        }

        // Format the total_budget values as currency without decimal places
        const formattedBudgets = budgets.map(budget => {
            return {
                ...budget,
                total_budget: new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0, // No decimal places
                    maximumFractionDigits: 0, // No decimal places
                }).format(budget.total_budget)
            };
        });

        console.log('\n\nTable 1b. Total Utilized Budgets (USD) by Department:\n');
        console.table(formattedBudgets);
        console.log('\n');
    } catch (err) {
        console.error('Error: Failed to generate departmental budget report:', err);
    }
};

module.exports = {
    getDepartments,
    addDepartment,
    removeDepartment,
    getBudgetReport
};
