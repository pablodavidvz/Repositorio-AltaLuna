// middleware/errorHandler.js

/**
 * Middleware para manejo de rutas no encontradas
 */
const notFoundHandler = (req, res) => {
    console.log(`🔍 Ruta no encontrada: ${req.method} ${req.path}`);
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
};

/**
 * Middleware para manejo de errores generales
 */
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error no manejado:', err);
    
    // Error de validación de MySQL
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            error: 'Registro duplicado',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
    
    // Error de conexión MySQL
    if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
        return res.status(503).json({
            error: 'Error de conexión a la base de datos',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
    
    // Error genérico
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    notFoundHandler,
    errorHandler
};