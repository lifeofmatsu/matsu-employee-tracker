const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_NAME
});

connection.connect(err => {
    if (err) throw err;
    console.log('Connected to the employee_tracker database.');
});

module.exports = connection;