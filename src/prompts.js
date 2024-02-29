const inquirer = require('inquirer');

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
};

module.exports = { userPrompt };