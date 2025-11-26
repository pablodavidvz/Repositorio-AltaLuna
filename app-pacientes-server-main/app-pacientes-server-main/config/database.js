// config/database.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Configuración de la conexión a MySQL
const dbConfig = {
    host: process.env.DB_HOST || 'srv1597.hstgr.io',
    user: process.env.DB_USER || 'u565673608_AltaLuna',
    password: process.env.DB_PASSWORD || '!w6CLEt7:',
    database: process.env.DB_NAME || 'u565673608_AltaLuna',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Pool de conexiones MySQL
const pool = mysql.createPool(dbConfig);

/**
 * Función para obtener una conexión del pool
 * @returns {Promise<mysql.PoolConnection>}
 */
const getConnection = async () => {
    try {
        return await pool.getConnection();
    } catch (error) {
        console.error('Error al obtener conexión de base de datos:', error);
        throw error;
    }
};

/**
 * Función para ejecutar consultas con manejo automático de conexiones
 * @param {string} query - La consulta SQL
 * @param {Array} params - Los parámetros de la consulta
 * @returns {Promise<Array>}
 */
const executeQuery = async (query, params = []) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Error al ejecutar consulta:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    pool,
    getConnection,
    executeQuery
};