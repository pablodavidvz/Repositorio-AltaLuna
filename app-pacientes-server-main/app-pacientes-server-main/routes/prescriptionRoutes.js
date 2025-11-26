// routes/prescriptionRoutes.js (ACTUALIZADO CON CERTIFICADOS MÉDICOS)
const express = require('express');
const router = express.Router();
const {
    getPrescriptionsByPatientId,
    getPrescriptionsByDNI,
    createPrescription,
    getStudiesByDNI
} = require('../controllers/prescriptionController');

const {
    getCertificatesByDNI,
    getCertificatesByPatientId,
    getCertificateByEncryptedId
} = require('../controllers/certificateController');

// ==========================================
// RUTAS DE RECETAS MÉDICAS
// ==========================================

/**
 * @route   GET /api/prescriptions/patient/:patientId
 * @desc    Obtener todas las recetas de un paciente por ID
 * @access  Public
 * @example GET /app-pacientes-server/api/prescriptions/patient/123
 */
router.get('/patient/:patientId', getPrescriptionsByPatientId);

/**
 * @route   GET /api/prescriptions/dni/:dni
 * @desc    Obtener todas las recetas de un paciente por DNI (CON MEDICAMENTOS)
 * @access  Public
 * @example GET /app-pacientes-server/api/prescriptions/dni/12345678
 */
router.get('/dni/:dni', getPrescriptionsByDNI);

/**
 * @route   POST /api/prescriptions
 * @desc    Crear una nueva receta
 * @access  Public
 * @body    { idpaciente: number, descripcion: string, ... }
 * @example POST /app-pacientes-server/api/prescriptions
 */
router.post('/', createPrescription);

// ==========================================
// RUTAS DE ESTUDIOS MÉDICOS
// ==========================================

/**
 * @route   GET /api/prescriptions/studies/dni/:dni
 * @desc    Obtener estudios médicos por DNI del paciente
 * @access  Public
 * @example GET /app-pacientes-server/api/prescriptions/studies/dni/38437748
 */
router.get('/studies/dni/:dni', getStudiesByDNI);

// ==========================================
// RUTAS DE CERTIFICADOS MÉDICOS
// ==========================================

/**
 * @route   GET /api/prescriptions/certificates/dni/:dni
 * @desc    Obtener certificados médicos por DNI del paciente
 * @access  Public
 * @example GET /app-pacientes-server/api/prescriptions/certificates/dni/38437748
 */
router.get('/certificates/dni/:dni', getCertificatesByDNI);

/**
 * @route   GET /api/prescriptions/certificates/patient/:patientId
 * @desc    Obtener certificados médicos por ID del paciente
 * @access  Public
 * @example GET /app-pacientes-server/api/prescriptions/certificates/patient/304057
 */
router.get('/certificates/patient/:patientId', getCertificatesByPatientId);

/**
 * @route   GET /api/prescriptions/certificates/certificate/:encryptedId
 * @desc    Obtener certificado específico por ID encriptado
 * @access  Public
 * @example GET /app-pacientes-server/api/prescriptions/certificates/certificate/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf
 */
router.get('/certificates/certificate/:encryptedId', getCertificateByEncryptedId);

// ENDPOINTS COMENTADOS TEMPORALMENTE (pueden agregarse después)
// router.put('/:prescriptionId', updatePrescription);
// router.delete('/:prescriptionId', deletePrescription);

module.exports = router;