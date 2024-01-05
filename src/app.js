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
                'Get Personnel by Department', //bonus
                'Get Personnel by Manager', //bonus
                'Generate Departmental Budget Report', //bonus
                'Add New Department',
                'Add New Occupation',
                'Add New Staff Personnel',
                'Edit Staff Department', //extra
                'Edit Staff Occupation',
                'Edit Reporting Manager', //bonus
                'Remove Department', //bonus
                'Remove Occupation', //bonus
                'Remove Staff Personnel', //bonus
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
        console.table(rows);
    } catch (err) {
        console.log('Error: Failed to fetch departments', err);
    }
}

// Gets list of occupations
const getOccupations = async () => {
    try {
         const query = `SELECT * FROM occupation`;
         const [rows] = await db.promise().query(query);
         console.table(rows);
    } catch (err) {
         console.error('Error: Failed to fetch occupations', err);
    }
}

// Gets list of personnel
const getPersonnel = async () => {
    try {
        const query = `SELECT * FROM personnel`;
        const [rows] = await db.promise().query(query);
        console.table(rows);
    } catch (err) {
        console.error('Error: Failed to fetch personnel', err);
    }
}

// BONUS: Gets personnel of a department
const getPersonnelByDept = async () => {
    try {
        // Query array of depts; user selects dept
        const [departments] = await db.promise().query('SELECT id, name FROM department');
        const { departmentId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'departmentId',
                message: 'Select a department to list its personnel:',
                choices: departments.map(dept => ({ name: dept.name, value: dept.id })),
            },
        ]);

        // Query personnel for selected dept
        const query = `
            SELECT personnel.id, personnel.first_name, personnel.last_name, occupation.title, department.name AS department
            FROM personnel
            JOIN occupation ON personnel.occupation_id = occupation.id
            JOIN department ON occupation.department_id = department.id
            WHERE department.id = ?
        `;
        const [personnel] = await db.promise().query(query, [departmentId]);
        
        console.table(personnel);
    } catch (err) {
        console.error('Error: Failed to fetch employees by department:', err);
    }
}

// BONUS: Gets the direct reports of a manager
const getPersonnelbyMgr = async () => {
    try {
        // Query array of managers; user selects manager
        const [managers] = await db.promise().query('SELECT id, first_name, last_name FROM personnel WHERE manager_id IS NOT NULL');
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
            SELECT personnel.id, personnel.first_name, personnel.last_name, occupation.title, department.name AS department
            FROM personnel
            JOIN occupation ON personnel.occupation_id = occupation.id
            JOIN department ON occupation.department_id = department.id
            WHERE personnel.manager_id = ?
        `;
        const [personnel] = await db.promise().query(query, [managerId]);

        console.table(personnel);
    } catch (err) {
        console.error('Error: Failed to fetch personnel by manager:', err);
    }
}

// BONUS: Generates departmental budget report (i.e. combined payroll salaries by dept)
const getBudgetReport = async () => {
    try {
        // Calculate total budget for each dept
        const query = `
            SELECT department.name AS Department, SUM(occupation.salary) AS TotalBudget
            FROM personnel
            JOIN occupation ON personnel.occupation_id = occupation.id
            JOIN department ON occupation.department_id = department.id
            GROUP BY department.id
        `;
        const [budgets] = await db.promise().query(query);

        // Check if any data is returned
        if (budgets.length === 0) {
            console.log('No budget data available.');
            return;
        }
        console.table(budgets);
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

// Adds new staff personnel
const addPersonnel = async () => {
    try {
        const personnel = await inquirer.prompt([
            {
                type: 'input',
                name: 'firstName',
                message: `Enter the staff's first name:`
            },
            {
                type: 'input',
                name: 'lastName',
                message: `Enter the staff's last name:`
            },
            {
                type: 'input',
                name: 'occupationId',
                message: `Enter the staff's occupation:`
            },
            {
                type: 'input',
                name: 'managerId',
                message: `Enter the staff's reporting manager (NULL if not applicable):`
            }
        ]);

        const insertQuery = `INSERT INTO employee (first_name, last_name, occupation_id, manager_id) VALUES (?, ?, ?, ?)`;
        await db.promise().query(insertQuery, [personnel.firstName, personnel.lastName, personnel.occupationId, personnel.managerId]);
        
        console.log('Personnel added successfully.');
    } catch (err) {
        console.error('Error: Failed to add employee', err);
    }
}

//EXTRA: Edits department for a staff member
const setDept = async () => {
    try {
        const personnel = await getPersonnel();
        const departments = await getDepts();

        const setVals = await inquirer.prompt([
            {
                type: 'list',
                name: 'staff',
                message: 'Select staff member to update:',
                choices: personnel // array of personnel
            },
            {
                type: 'list',
                name: 'departmentId',
                message: 'Select new department:',
                choices: departments // array of departments
            }
        ]);

        const updateQuery = `UPDATE personnel SET department_id = ? WHERE id = ?`;
        await db.promise().query(updateQuery, [setVals.departmentId, setVals.staff]); 
        
        console.log('Staff department updated successfully');
    } catch (err) {
        console.error('Error: Failed to update staff department', err);
    }
}

// Edits occupation for a staff member
const setOccupation = async () => {
    try {
        const personnel = await getPersonnel();
        const occupations = await getOccupations();

        const setVals = await inquirer.prompt([
            {
                type: 'list',
                name: 'staff',
                message: 'Select staff member to update:',
                choices: personnel // array of personnel
            },
            {
                type: 'list',
                name: 'occupationId',
                message: 'Select new occupation:',
                choices: occupations // array of occupations
            }
        ]);

        const updateQuery = `UPDATE personnel SET occupation_id = ? WHERE id = ?`;
        await db.promise().query(updateQuery, [setVals.occupationId, setVals.staff]);

        console.log('Staff occupation updated successfully.');
    } catch (err) {
        console.error('Error: Failed to update staff occupation', err);
    }
}

// BONUS: Edits the reporting manager for a staff member
const setMgr = async () => {
    try {
        const [personnel] = await db.promise().query('SELECT id, first_name, last_name FROM personnel');

        const staffList = personnel.map(staff => ({
            name: `${staff.first_name} ${staff.last_name}`,
            value: staff.id
        }));

        const { personnelId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'personnelId',
                message: 'Select an employee to update their manager:',
                choices: staffList
            }
        ]);

        const [managers] = await db.promise().query('SELECT id, first_name, last_name FROM personnel WHERE id != ?', [personnelId]);

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

        const updateQuery = 'UPDATE personnel SET manager_id = ? WHERE id = ?';
        await db.promise().query(updateQuery, [newManagerId, personnelId]);''
         
        console.log('Manager updated successfully');
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
const removePersonnel = async () => {
    try {
        const [personnel] = await db.promise().query('SELECT id, first_name, last_name FROM personnel');

        const staffList = personnel.map(staff => ({
            name: `${staff.first_name} ${staff.last_name}`,
            value: staff.id
        }));

        const { personnelId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'personnelId',
                message: 'Select an employee to remove:',
                choices: staffList
            }
        ]);

        const removeQuery = 'DELETE FROM personnel WHERE id = ?';
        await db.promise().query(removeQuery, [personnelId]);

        console.log('Employee removed successfully');
    } catch(err) {
        console.error('Error: Failed to remove the selected staff member', err);
    }
}

// Initalize application
const main = async () => {
    userPrompt()
    .then(input => {
        switch (input.actions) {
            case 'Get List of Departments':
                getDepts();
                break;
            case 'Get List of Occupations':
                getOccupations();
                break;
            case 'Get List of Personnel':
                getPersonnel();
                break;
            case 'Get Personnel by Department': //bonus
                getPersonnelByDept();
                break;
            case 'Get Direct Reports by Manager': //bonus
                getPersonnelbyMgr();
                break;
            case 'Generate Departmental Budget Report': //bonus
                getBudgetReport();
                break;
            case 'Add New Department':
                addDept();
                break;
            case 'Add New Occupation':
                addOccupation();
                break;
            case 'Add New Staff Personnel':
                addPersonnel();
                break;
            case 'Edit Staff Department': //extra
                setDept();
                break;
            case 'Edit Staff Occupation':
                setOccupation();
                break;
            case 'Edit Reporting Manager': //bonus
                setMgr();
                break;
            case 'Remove Department': //bonus
                removeDept();
                break;
            case 'Remove Occupation': //bonus
                removeOccupation();
                break;
            case 'Remove Staff Personnel': //bonus
                removePersonnel();
                break;
            case 'Exit':
                db.end();
                break;
            default:
                console.log('Action not recognized');
                break;
        }        
    });
}

main();