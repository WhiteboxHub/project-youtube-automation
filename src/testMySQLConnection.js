
require('dotenv').config(); // Load environment variables

const mysql = require('mysql2/promise');

// Create a database pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Function to execute a query within a transaction
async function executeTransaction(query, values) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction(); // Start transaction
        const [result] = await connection.execute(query, values); // Execute query
        await connection.commit(); // Commit transaction
        return result; // Return query result
    } catch (error) {
        await connection.rollback(); // Rollback transaction on error
        console.error("Transaction failed:", error.message);
        throw error;
    } finally {
        connection.release(); // Release the connection
    }
}

module.exports = { executeTransaction };
