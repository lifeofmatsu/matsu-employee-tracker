const inquirer = require('inquirer');
const db = require('./db');

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

const main = async () => {
    userPrompt()
    .then(input => {
        switch (input.actions) {
            case 'View All Departments':

                break;
            case 'Add Department':

                break;
            case 'View All Staff Roles':

                break;
            case 'Add Staff Role':

                break;
            case 'View All Employees':

                break;
            case 'Add Employee':

                break;
            case 'Update Employee Role':

                break;
            case 'Exit':
                db.end();
                break;
        }
    });
}

main();