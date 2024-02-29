const inquirer = require('inquirer');
const db = require('../db');


// Fetches all the occupations across all departments
const getOccupations = async () => {
	try {
		const [occupations] = await db.promise().query(
			`SELECT occupation.id, occupation.title, department.name AS department, occupation.salary
             FROM occupation
             JOIN department ON occupation.department_id = department.id`
		);

        // Formats `salary` values as currency without decimal places
        const formattedOccupations = occupations.map(occupation => {
            return {
                ...occupation,
                salary: new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0, // No decimal places
                    maximumFractionDigits: 0, // No decimal places
                }).format(occupation.salary)
            };
        });

		console.log('\n\nTable 2. Catalog of Occupations for ALL Departments:\n');
		console.table(formattedOccupations);
		console.log('\n');
	} catch (err) {
		console.error('Error: Failed to fetch occupations', err);
	}
};

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

        // Check for existing occupation in the same department
        const [existingOccupation] = await db.promise().query(
            `SELECT * FROM occupation WHERE title = ? AND department_id = ?`, 
            [userVals.title, userVals.departmentId]
        );

        if (existingOccupation.length > 0) {
            console.log(`\nOccupation [${userVals.title}] already exists in the selected department. Please enter a unique occupation name.\n`);
            return; // Exit the function if occupation already exists
        }

        // Proceed to insert the new occupation
        await db.promise().query(
            `INSERT INTO occupation (title, salary, department_id) VALUES (?, ?, ?)`,
             [userVals.title, userVals.salary, userVals.departmentId]
        );

        const userSelectDept = departmentList.find((dept) => dept.value === userVals.departmentId).name;
        console.log(`\nThe occupation [${userVals.title}] with salary [\$${userVals.salary}] has been added to the [${userSelectDept}] department.\n`);
    } catch (err) {
        console.error('Error: Failed to add occupation', err);
    }
};

// Modifies an employee's occupation
const setOccupation = async () => {
	try {
		const [employees] = await db
			.promise()
			.query('SELECT id, first_name, last_name FROM employee');
		const employeeList = employees.map((emp) => ({
			name: `${emp.first_name} ${emp.last_name}`,
			value: emp.id
		}));

		const [occupations] = await db
			.promise()
			.query('SELECT id, title FROM occupation');
		const occupationList = occupations.map((occ) => ({
			name: occ.title,
			value: occ.id
		}));

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

		await db
			.promise()
			.query(`UPDATE employee SET occupation_id = ? WHERE id = ?`, [
				userVals.occupationId,
				userVals.employeeId
			]);

		// User 'employee' & 'occupation' selections
		const userSelectEmployee = employeeList.find((emp) => emp.value === userVals.employeeId).name;
		const userSelectOccupation = occupationList.find((occ) => occ.value === userVals.occupationId).name;

		console.log(`\n[${userSelectEmployee}]'s occupation has been changed to [${userSelectOccupation}].\n`);
	} catch (err) {
		console.error(`Error: Failed to update the employee's occupation`, err);
	}
};

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

        // Fetch employees' names and the occupation title for the occupation to be removed
        const employeesToRemove = await db.promise().query(
            `SELECT e.first_name, e.last_name, o.title AS prior_occupation
             FROM employee e
             JOIN occupation o ON e.occupation_id = o.id
             WHERE o.id = ?`, [occupationId]);

        // Assuming you have columns for first_name, last_name, prior_occupation, and laid_off_date
        if (employeesToRemove[0].length > 0) {
            employeesToRemove[0].forEach(async (employee) => {
                const { first_name, last_name, prior_occupation } = employee;
                const laidOffDate = new Date().toISOString().slice(0, 10); // Using current date as laid off date

                await db.promise().query(
                    `INSERT INTO former_employees (first_name, last_name, prior_occupation, laid_off_date)
                     VALUES (?, ?, ?, ?)`, 
                    [first_name, last_name, prior_occupation, laidOffDate]);
            });
        }

        // Now, remove the occupation from the occupation table
        await db.promise().query('DELETE FROM occupation WHERE id = ?', [occupationId]);

        const userSelectOccupation = occupationList.find(occ => occ.value === occupationId).name;
        console.log(`\nThe role [${userSelectOccupation}] has been removed as an occupation.\n`);
    } catch(err) {
        console.error('Error: Failed to remove the selected occupation', err);
    }
};

module.exports = {
    getOccupations,
    addOccupation,
    setOccupation,
    removeOccupation
};
