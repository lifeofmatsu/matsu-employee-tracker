const db = require('./src/db');
const { userPrompt } = require('./src/prompts');
const {
    getDepartments,
    addDepartment,
    removeDepartment,
    getBudgetReport } = require('./src/operations/departments');
const {
    getOccupations,
    addOccupation,
    setOccupation,
    removeOccupation } = require('./src/operations/occupations');
const {
    getEmployees,
    addEmployee,
    removeEmployee,
    getEmployeesByDept,
    getEmployeesbyMgr,
    setManager } = require('./src/operations/employees');


// Initalize application
const main = async () => {
	let exit = false;
	while (!exit) {
		const input = await userPrompt();
		switch (input.actions) {
			case 'View ALL Departments':
				await getDepartments();
				break;
			case 'View ALL Occupations':
				await getOccupations();
				break;
			case 'View ALL Employees':
				await getEmployees();
				break;
			case 'View Employees by Department':
				await getEmployeesByDept();
				break;
			case 'View Employees by Manager':
				await getEmployeesbyMgr();
				break;
			case 'View Departmental Budget Report':
				await getBudgetReport();
				break;
			case 'Add New Department':
				await addDepartment();
				break;
			case 'Add New Occupation':
				await addOccupation();
				break;
			case 'Add New Employee':
				await addEmployee();
				break;
			case 'Update Employee Occupation':
				await setOccupation();
				break;
			case 'Update Employee Manager':
				await setManager();
				break;
			case 'Remove Department':
				await removeDepartment();
				break;
			case 'Remove Occupation':
				await removeOccupation();
				break;
			case 'Remove Employee':
				await removeEmployee();
				break;
			case 'Exit':
				console.log('Exiting application.');
				db.end(); // Close database connection
				exit = true;
				break;
			default:
				console.log('Selection not recognized. Please try again.');
				break;
		}
	}
};

main().catch((err) => console.error(err));
