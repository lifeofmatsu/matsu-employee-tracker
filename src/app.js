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
                'View All Departments',
                'Add Department',
                'View All Staff Roles',
                'Add Staff Role',
                'View All Employees',
                'Add Employee',
                'Update Employee Role',
                'Exit'
            ]
        }
     ]);
}

const getDepts = async () => {
    
}

const addDept = async () => {

}

const getRoles = async () => {

}

const addRole = async () => {

}

const getEmployees = async () => {
    try {
        const query = `SELECT * FROM employee`;
        const [rows] = await db.promise().query(query);
        console.table(rows);
    } catch (err) {
        console.error('Error: Failed to fetch employees', err);
    }
}

const addEmployee = async () => {
    try {
        const employeeValues = await inquirer.prompt([
            {
                type: 'input',
                name: 'firstName',
                message: `Enter the employee's first name:`,
            },
            {
                type: 'input',
                name: 'lastName',
                message: `Enter the employee's last name:`
            },
            {
                type: 'input',
                name: 'roleId',
                message: `Enter the employee's staff role:`
            },
            {
                type: 'input',
                name: 'managerId',
                message: `Enter the employee's manager (NULL if not applicable):`
            }
        ]);

        const insertQuery = `first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)`;
        await db.promise().query(insertQuery, [employeeValues.firstName, employeeValues.lastName, employeeValues.roleId, employeeValues.managerId]);
        
        console.log('Employee added successfully.');
    } catch (err) {
        console.error('Error: Failed to add employee', err);
    }
}

const setEmployeeRole = async () => {
    try {
        const employees = await getEmployees();
        const roles = await getRoles();

        const setValues = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeVal',
                message: 'Select an employee to update:',
                choices: employees // array of employees
            },
            {
                type: 'list',
                name: 'roleId',
                message: 'Select new role:',
                choices: roles // array of roles
            }
        ]);

        const updateQuery = `UPDATE employee SET role_id = ? WHERE id = ?`;
        await db.promise().query(updateQuery, [setValues.roleId, setValues.employeeVal]);

        console.log(`Employee role updated successfully.`);
    } catch (err) {
        console.log('Error: Failed to update employee role', err);
    }
}

// Initalize application
const main = async () => {
    userPrompt()
    .then(input => {
        switch (input.actions) {
            case 'View All Departments':
                getDepts();
                break;
            case 'Add Department':
                addDept();
                break;
            case 'View All Staff Roles':
                getRoles();
                break;
            case 'Add Staff Role':
                addRole();
                break;
            case 'View All Employees':
                getEmployees();
                break;
            case 'Add Employee':
                addEmployee();
                break;
            case 'Update Employee Role':
                setEmployeeRole();
                break;
            case 'Exit':
                db.end();
                break;
        }
    });
}

main();