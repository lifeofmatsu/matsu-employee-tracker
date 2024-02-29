const db = require('../db');


// Fetches a list of all departments
const getDepartments = async () => {
	try {
		const [departments] = await db
			.promise()
			.query(`SELECT * FROM department`);

		console.log('\n\nCatalog of Departments at OOO Software Company:\n');
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

		console.log(`\nThe department [${departmentName}] has been added.\n`);
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
		// Fetch all departments
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
             WHERE occupation.department_id = ?`,
			[departmentId]
		);

		// Delete affected employees
		await db.promise().query(
			`DELETE employee
             FROM employee
             JOIN occupation ON employee.occupation_id = occupation.id 
             WHERE occupation.department_id = ?`,
			[departmentId]
		);

		await db
			.promise()
			.query('DELETE FROM occupation WHERE department_id = ?', [
				departmentId
			]);
		await db
			.promise()
			.query('DELETE FROM department WHERE id = ?', [departmentId]);

		const userSelection = departmentList.find(
			(dept) => dept.value === departmentId
		).name; // User 'department' selection

		console.log(
			`\nThe [${userSelection}] department has been removed.\n All [${userSelection}] personnel have been dismissed.\n`
		);
	} catch (err) {
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

		console.log('\n\nTable of Total Utilized Budgets (USD) by Department:\n');
		console.table(budgets);
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
