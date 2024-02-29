const db = require('../db');


// Fetches all the occupations across all departments
const getOccupations = async () => {
	try {
		const [occupations] = await db.promise().query(
			`SELECT occupation.id, occupation.title, department.name AS department, occupation.salary
             FROM occupation
             JOIN department ON occupation.department_id = department.id`
		);

		console.log('\n\nCatalog of Occupations for ALL Departments:\n');
		console.table(occupations);
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

        console.log(`\nThe occupation [${userVals.title}] with salary [${userVals.salary}] is now listed under department ID [${userVals.departmentId}].\n`);
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
		const selectedEmp = employeeList.find(
			(emp) => emp.value === userVals.employeeId
		).name;
		const selectedOcc = occupationList.find(
			(occ) => occ.value === userVals.occupationId
		).name;

		console.log(
			`\n[${selectedEmp}]'s occupation has been changed to [${selectedOcc}].\n`
		);
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
		const [occupations] = await db
			.promise()
			.query('SELECT id, title FROM occupation');
		const occupationList = occupations.map((occ) => ({
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

		// Move affected employees to the former_employees table
		await db.promise().query(
			`INSERT INTO former_employees (first_name, last_name, ...)
             SELECT first_name, last_name, ... 
             FROM employee 
             WHERE occupation_id = ?`,
			[occupationId]
		);

		await db
			.promise()
			.query('DELETE FROM employee WHERE occupation_id = ?', [
				occupationId
			]);
		await db
			.promise()
			.query('DELETE FROM occupation WHERE id = ?', [occupationId]);

		const userSelection = occupationList.find(
			(occ) => occ.value === occupationId
		).name; // User 'occupation' selection

		console.log(
			`\nThe [${userSelection}] occupation has been removed.\n All [${userSelection}] personnel have been dismissed.\n`
		);
	} catch (err) {
		console.error('Error: Failed to remove the selected occupation', err);
	}
};

module.exports = {
    getOccupations,
    addOccupation,
    setOccupation,
    removeOccupation
};
