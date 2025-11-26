// server.js - Servidor Express refactorizado para la App de rec_paciente
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// Importar middleware
const { checkDatabaseConnection } = require('./middleware/database');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Importar rutas
const patientRoutes = require('./routes/patientRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Configuración de middleware global
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para logging de requests
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`📥 [${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Middleware para verificar conexión a la base de datos
app.use('/app-pacientes-server/api', checkDatabaseConnection);

// ==========================================
// RUTAS PRINCIPALES
// ==========================================

/**
 * @route   GET /app-pacientes-server/status
 * @desc    Estado del servidor
 * @access  Public
 */
app.get('/app-pacientes-server/status', (req, res) => {
    res.json({
        message: 'API del servidor de Pacientes funcionando correctamente',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        version: '2.1.0', // Actualizado con certificados
        endpoints: {
            patients: '/app-pacientes-server/api/patients',
            prescriptions: '/app-pacientes-server/api/prescriptions',
            studies: '/app-pacientes-server/api/prescriptions/studies',
            certificates: '/app-pacientes-server/api/prescriptions/certificates'
        }
    });
});

/**
 * @route   GET /
 * @desc    Ruta raíz
 * @access  Public
 */
app.get('/', (req, res) => {
    res.json({
        message: 'API del servidor de Pacientes funcionando correctamente',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        documentation: '/app-pacientes-server/status'
    });
});

// ==========================================
// RUTAS DE LA API
// ==========================================

// Rutas de pacientes
app.use('/app-pacientes-server/api/patients', patientRoutes);

// Rutas de recetas, estudios y certificados
app.use('/app-pacientes-server/api/prescriptions', prescriptionRoutes);

// ==========================================
// ENDPOINTS PLACEHOLDER PARA FUTURAS FUNCIONALIDADES
// ==========================================

/**
 * @route   GET /app-pacientes-server/api/patients/:id/appointments
 * @desc    Obtener próximas citas médicas del paciente
 * @access  Public (Placeholder)
 */
app.get('/app-pacientes-server/api/patients/:id/appointments', (req, res) => {
    const { id } = req.params;
    console.log(`📅 [APPOINTMENTS] Placeholder - Consultando citas para paciente ID: ${id}`);
    
    res.json({
        message: 'Funcionalidad de citas médicas en desarrollo',
        patientId: id,
        appointments: [],
        plannedFeatures: [
            'Agendar nuevas citas',
            'Cancelar citas existentes',
            'Recordatorios automáticos',
            'Integración con calendarios'
        ]
    });
});

/**
 * @route   GET /app-pacientes-server/api/patients/:id/medical-tests
 * @desc    Obtener estudios médicos del paciente
 * @access  Public (Placeholder)
 */
app.get('/app-pacientes-server/api/patients/:id/medical-tests', (req, res) => {
    const { id } = req.params;
    console.log(`🔬 [MEDICAL-TESTS] Placeholder - Consultando estudios para paciente ID: ${id}`);
    
    res.json({
        message: 'Funcionalidad de estudios médicos en desarrollo',
        patientId: id,
        medicalTests: [],
        plannedFeatures: [
            'Cargar resultados de laboratorio',
            'Gestionar estudios por imagen',
            'Historial de estudios',
            'Compartir con profesionales'
        ]
    });
});

// ==========================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ==========================================

// Manejo de rutas no encontradas
app.use(notFoundHandler);

// Middleware para manejo de errores generales
app.use(errorHandler);

// ==========================================
// INICIALIZACIÓN DEL SERVIDOR
// ==========================================

/**
 * Función para inicializar el servidor
 */
const startServer = () => {
    app.listen(PORT, () => {
        console.log('\n🚀 ========================================');
        console.log('   SERVIDOR PACIENTES INICIADO');
        console.log('🚀 ========================================');
        console.log(`📡 Puerto: ${PORT}`);
        console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        console.log(`⏰ Iniciado: ${new Date().toISOString()}`);
        console.log('\n📋 URLs disponibles:');
        console.log(`   ✅ Status: http://localhost:${PORT}/app-pacientes-server/status`);
        console.log(`   👤 Pacientes: http://localhost:${PORT}/app-pacientes-server/api/patients`);
        console.log(`   📋 Recetas: http://localhost:${PORT}/app-pacientes-server/api/prescriptions`);
        console.log(`   🔬 Estudios: http://localhost:${PORT}/app-pacientes-server/api/prescriptions/studies`);
        console.log(`   🏥 Certificados: http://localhost:${PORT}/app-pacientes-server/api/prescriptions/certificates`);
        console.log('\n🔍 Endpoints principales:');
        console.log(`   • Check paciente: GET /api/patients/check/:dni`);
        console.log(`   • Recetas por DNI: GET /api/prescriptions/dni/:dni`);
        console.log(`   • Estudios por DNI: GET /api/prescriptions/studies/dni/:dni`);
        console.log(`   • Certificados por DNI: GET /api/prescriptions/certificates/dni/:dni`);
        console.log(`   • Crear paciente: POST /api/patients`);
        console.log(`   • Crear receta: POST /api/prescriptions`);
        console.log('\n🏥 Nuevos endpoints de Certificados Médicos:');
        console.log(`   • Por DNI: GET /api/prescriptions/certificates/dni/:dni`);
        console.log(`   • Por ID paciente: GET /api/prescriptions/certificates/patient/:patientId`);
        console.log(`   • Por ID encriptado: GET /api/prescriptions/certificates/certificate/:encryptedId`);
        console.log('🚀 ========================================\n');
    });
};

// Manejo de errores de proceso
process.on('uncaughtException', (err) => {
    console.error('❌ Excepción no capturada:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    process.exit(1);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM recibido. Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT recibido. Cerrando servidor...');
    process.exit(0);
});

// Iniciar el servidor
startServer();

module.exports = app;