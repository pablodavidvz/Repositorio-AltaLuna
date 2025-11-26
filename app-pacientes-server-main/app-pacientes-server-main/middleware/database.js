// middleware/database.js
const { getConnection } = require('../config/database');

/**
 * Middleware para verificar la conexión a la base de datos
 * Agrega la función de conexión a req para usar en rutas
 */
const checkDatabaseConnection = async (req, res, next) => {
    try {
        // Verificar que la conexión funcione
        const connection = await getConnection();
        connection.release(); // Liberar inmediatamente
        
        console.log('✅ Conexión a base de datos verificada');
        next();
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error);
        res.status(500).json({
            error: 'Error de conexión a la base de datos',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    checkDatabaseConnection
};