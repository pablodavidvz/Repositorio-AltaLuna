// routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const {
    checkPatientByDNI,
    createPatient,
    updatePatient,
    updatePatientWithDNI
} = require('../controllers/patientController');

/**
 * @route   GET /api/patients/check/:dni
 * @desc    Verificar si existe un paciente por DNI
 * @access  Public
 * @example GET /app-pacientes-server/api/patients/check/12345678
 */
router.get('/check/:dni', checkPatientByDNI);

/**
 * @route   POST /api/patients
 * @desc    Registrar nuevo paciente
 * @access  Public
 * @body    { dni: string, nombre: string, apellido: string, sexo: string, ... }
 * @example POST /app-pacientes-server/api/patients
 */
router.post('/', createPatient);

/**
 * @route   PUT /api/patients/:id
 * @desc    Actualizar paciente (actualización manual desde perfil)
 * @access  Public
 * @example PUT /app-pacientes-server/api/patients/123
 */
router.put('/:id', updatePatient);

/**
 * @route   PUT /api/patients/:id/dni-update
 * @desc    Actualizar paciente con datos del DNI escaneado
 * @access  Public
 * @example PUT /app-pacientes-server/api/patients/123/dni-update
 */
router.put('/:id/dni-update', updatePatientWithDNI);

module.exports = router;