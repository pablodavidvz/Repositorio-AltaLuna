// controllers/certificateController.js - Certificados Médicos
const { executeQuery } = require('../config/database');

/**
 * Obtener certificados médicos de un paciente por DNI
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getCertificatesByDNI = async (req, res) => {
    const { dni } = req.params;
    
    console.log(`🏥 [CERTIFICATES-DNI] Consultando certificados para DNI: ${dni}`);
    
    try {
        // Validar DNI
        if (!dni || dni.trim() === '') {
            return res.status(400).json({
                error: 'DNI requerido',
                details: 'Debe proporcionar un DNI válido'
            });
        }
        
        // Primero buscar el paciente por DNI
        const patients = await executeQuery(
            'SELECT * FROM rec_paciente WHERE dni = ?',
            [dni]
        );
        
        if (patients.length === 0) {
            console.log(`❌ [CERTIFICATES-DNI] Paciente no encontrado con DNI: ${dni}`);
            return res.status(404).json({
                error: 'Paciente no encontrado',
                details: `No se encontró un paciente con DNI: ${dni}`
            });
        }
        
        const patient = patients[0];
        console.log(`👤 [CERTIFICATES-DNI] Paciente encontrado:`, {
            id: patient.id,
            nombre: patient.nombre,
            apellido: patient.apellido,
            dni: patient.dni
        });
        
        // Buscar certificados del paciente CON datos del médico
        const certificates = await executeQuery(`
            SELECT 
                cc.idestudio as id,
                cc.id_encriptado,
                cc.fechaemision as fecha_emision,
                cc.ipprescriptor,
                cc.matricprescr,
                cc.matricespec_prescr,
                cc.idpaciente,
                cc.idobrasocafiliado,
                cc.lugaratencion,
                cc.diagnostico,
                cc.diagnostico2,
                cc.estado,
                cc.anulacionmotivo,
                cc.identidadreserv,
                cc.device,
                tp.nombre as medico_nombre,
                tp.apellido as medico_apellido,
                CONCAT(tp.nombre, ' ', tp.apellido) as medico_nombre_completo
            FROM cert_cabecera cc
            LEFT JOIN tmp_person tp ON cc.matricprescr = tp.matricula
            WHERE cc.idpaciente = ?
            ORDER BY cc.fechaemision DESC
        `, [patient.id]);
        
        console.log(`🏥 [CERTIFICATES-DNI] Encontrados ${certificates.length} certificados médicos`);
        
        // Mapear los certificados para que coincidan con la estructura esperada por el frontend
        const mappedCertificates = certificates.map(cert => {
            // Determinar tipo de certificado basado en diagnóstico o datos existentes
            let tipoCertificado = 'REPOSO'; // Valor por defecto
            const diagnosticoLower = (cert.diagnostico || '').toLowerCase();
            
            if (diagnosticoLower.includes('aptitud') || diagnosticoLower.includes('apto')) {
                tipoCertificado = 'APTITUD';
            } else if (diagnosticoLower.includes('discapacidad')) {
                tipoCertificado = 'DISCAPACIDAD';
            } else if (diagnosticoLower.includes('salud')) {
                tipoCertificado = 'SALUD';
            } else if (diagnosticoLower.includes('medico')) {
                tipoCertificado = 'MEDICO';
            }
            
            // Calcular fechas y días de reposo si es certificado de reposo
            let fechaInicio = cert.fechaemision;
            let fechaFin = null;
            let diasReposo = null;
            
            if (tipoCertificado === 'REPOSO' && cert.diagnostico2) {
                // Intentar extraer días de reposo del diagnostico2
                const diasMatch = cert.diagnostico2.match(/(\d+)\s*d[íi]as?/i);
                if (diasMatch) {
                    diasReposo = parseInt(diasMatch[1]);
                    const fechaInicioDate = new Date(cert.fechaemision);
                    const fechaFinDate = new Date(fechaInicioDate);
                    fechaFinDate.setDate(fechaFinDate.getDate() + diasReposo);
                    fechaFin = fechaFinDate.toISOString();
                }
            }
            
            return {
                id: cert.id,
                id_encriptado: cert.id_encriptado,
                tipo_certificado: tipoCertificado,
                fecha_emision: cert.fecha_emision,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                dias_reposo: diasReposo,
                estado: determineCertificateStatus(cert, fechaFin),
                medico_emisor: cert.medico_nombre_completo || `Matrícula: ${cert.matricprescr}`,
                medico_nombre: cert.medico_nombre,
                medico_apellido: cert.medico_apellido,
                centro_medico: cert.lugaratencion || null,
                observaciones: cert.diagnostico2 || null,
                matricula_prescriptor: cert.matricprescr,
                matricula_especialidad: cert.matricespec_prescr,
                ip_prescriptor: cert.ipprescriptor,
                device: cert.device,
                original_data: {
                    diagnostico: cert.diagnostico,
                    diagnostico2: cert.diagnostico2,
                    estado: cert.estado
                }
            };
        });
        
        res.json({
            success: true,
            patient: {
                id: patient.id,
                dni: patient.dni,
                nombre: patient.nombre,
                apellido: patient.apellido,
                sexo: patient.sexo,
                fecnac: patient.fecnac
            },
            count: mappedCertificates.length,
            certificates: mappedCertificates
        });
        
    } catch (error) {
        console.error('❌ [CERTIFICATES-DNI] Error al obtener certificados por DNI:', error);
        res.status(500).json({
            error: 'Error al obtener los certificados médicos por DNI',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener certificados médicos de un paciente por su ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getCertificatesByPatientId = async (req, res) => {
    const { patientId } = req.params;
    
    console.log(`🏥 [CERTIFICATES] Consultando certificados para paciente ID: ${patientId}`);
    
    try {
        // Validar que el ID del paciente sea un número
        if (!patientId || isNaN(patientId)) {
            return res.status(400).json({
                error: 'ID de paciente inválido',
                details: 'El ID debe ser un número válido'
            });
        }
        
        // Consultar certificados del paciente CON datos del médico
        const certificates = await executeQuery(`
            SELECT 
                cc.idestudio as id,
                cc.id_encriptado,
                cc.fechaemision as fecha_emision,
                cc.ipprescriptor,
                cc.matricprescr,
                cc.matricespec_prescr,
                cc.idpaciente,
                cc.idobrasocafiliado,
                cc.lugaratencion,
                cc.diagnostico,
                cc.diagnostico2,
                cc.estado,
                cc.anulacionmotivo,
                cc.device,
                tp.nombre as medico_nombre,
                tp.apellido as medico_apellido,
                CONCAT(tp.nombre, ' ', tp.apellido) as medico_nombre_completo
            FROM cert_cabecera cc
            LEFT JOIN tmp_person tp ON cc.matricprescr = tp.matricula
            WHERE cc.idpaciente = ?
            ORDER BY cc.fechaemision DESC
        `, [patientId]);
        
        // Mapear certificados (mismo proceso que arriba)
        const mappedCertificates = certificates.map(cert => {
            let tipoCertificado = 'REPOSO';
            const diagnosticoLower = (cert.diagnostico || '').toLowerCase();
            
            if (diagnosticoLower.includes('aptitud') || diagnosticoLower.includes('apto')) {
                tipoCertificado = 'APTITUD';
            } else if (diagnosticoLower.includes('discapacidad')) {
                tipoCertificado = 'DISCAPACIDAD';
            } else if (diagnosticoLower.includes('salud')) {
                tipoCertificado = 'SALUD';
            } else if (diagnosticoLower.includes('medico')) {
                tipoCertificado = 'MEDICO';
            }
            
            let fechaInicio = cert.fecha_emision;
            let fechaFin = null;
            let diasReposo = null;
            
            if (tipoCertificado === 'REPOSO' && cert.diagnostico2) {
                const diasMatch = cert.diagnostico2.match(/(\d+)\s*d[íi]as?/i);
                if (diasMatch) {
                    diasReposo = parseInt(diasMatch[1]);
                    const fechaInicioDate = new Date(cert.fecha_emision);
                    const fechaFinDate = new Date(fechaInicioDate);
                    fechaFinDate.setDate(fechaFinDate.getDate() + diasReposo);
                    fechaFin = fechaFinDate.toISOString();
                }
            }
            
            return {
                id: cert.id,
                id_encriptado: cert.id_encriptado,
                tipo_certificado: tipoCertificado,
                fecha_emision: cert.fecha_emision,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                dias_reposo: diasReposo,
                estado: determineCertificateStatus(cert, fechaFin),
                medico_emisor: cert.medico_nombre_completo || `Matrícula: ${cert.matricprescr}`,
                medico_nombre: cert.medico_nombre,
                medico_apellido: cert.medico_apellido,
                centro_medico: cert.lugaratencion || null,
                observaciones: cert.diagnostico2 || null,
                matricula_prescriptor: cert.matricprescr,
                matricula_especialidad: cert.matricespec_prescr,
                ip_prescriptor: cert.ipprescriptor,
                device: cert.device,
                original_data: {
                    diagnostico: cert.diagnostico,
                    diagnostico2: cert.diagnostico2,
                    estado: cert.estado
                }
            };
        });
        
        console.log(`🏥 [CERTIFICATES] Encontrados ${mappedCertificates.length} certificados`);
        
        res.json({
            success: true,
            count: mappedCertificates.length,
            certificates: mappedCertificates
        });
        
    } catch (error) {
        console.error('❌ [CERTIFICATES] Error al obtener certificados:', error);
        res.status(500).json({
            error: 'Error al obtener los certificados del paciente',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener certificado específico por ID encriptado
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getCertificateByEncryptedId = async (req, res) => {
    const { encryptedId } = req.params;
    
    console.log(`🏥 [CERTIFICATE-BY-ID] Consultando certificado con ID: ${encryptedId}`);
    
    try {
        // Validar ID encriptado
        if (!encryptedId || encryptedId.trim() === '') {
            return res.status(400).json({
                error: 'ID encriptado requerido',
                details: 'Debe proporcionar un ID encriptado válido'
            });
        }
        
        // Buscar certificado por ID encriptado CON datos del médico Y paciente
        const certificates = await executeQuery(`
            SELECT 
                cc.idestudio as id,
                cc.id_encriptado,
                cc.fechaemision as fecha_emision,
                cc.ipprescriptor,
                cc.matricprescr,
                cc.matricespec_prescr,
                cc.idpaciente,
                cc.idobrasocafiliado,
                cc.lugaratencion,
                cc.diagnostico,
                cc.diagnostico2,
                cc.estado,
                cc.anulacionmotivo,
                cc.device,
                tp.nombre as medico_nombre,
                tp.apellido as medico_apellido,
                CONCAT(tp.nombre, ' ', tp.apellido) as medico_nombre_completo,
                p.dni,
                p.nombre as paciente_nombre,
                p.apellido as paciente_apellido,
                p.sexo,
                p.fecnac
            FROM cert_cabecera cc
            LEFT JOIN tmp_person tp ON cc.matricprescr = tp.matricula
            LEFT JOIN rec_paciente p ON cc.idpaciente = p.id
            WHERE cc.id_encriptado = ?
        `, [encryptedId]);
        
        if (certificates.length === 0) {
            console.log(`❌ [CERTIFICATE-BY-ID] Certificado no encontrado con ID: ${encryptedId}`);
            return res.status(404).json({
                error: 'Certificado no encontrado',
                details: `No se encontró un certificado con ID: ${encryptedId}`
            });
        }
        
        const cert = certificates[0];
        
        // Mapear certificado con datos del paciente
        let tipoCertificado = 'REPOSO';
        const diagnosticoLower = (cert.diagnostico || '').toLowerCase();
        
        if (diagnosticoLower.includes('aptitud') || diagnosticoLower.includes('apto')) {
            tipoCertificado = 'APTITUD';
        } else if (diagnosticoLower.includes('discapacidad')) {
            tipoCertificado = 'DISCAPACIDAD';
        } else if (diagnosticoLower.includes('salud')) {
            tipoCertificado = 'SALUD';
        } else if (diagnosticoLower.includes('medico')) {
            tipoCertificado = 'MEDICO';
        }
        
        let fechaInicio = cert.fecha_emision;
        let fechaFin = null;
        let diasReposo = null;
        
        if (tipoCertificado === 'REPOSO' && cert.diagnostico2) {
            const diasMatch = cert.diagnostico2.match(/(\d+)\s*d[íi]as?/i);
            if (diasMatch) {
                diasReposo = parseInt(diasMatch[1]);
                const fechaInicioDate = new Date(cert.fecha_emision);
                const fechaFinDate = new Date(fechaInicioDate);
                fechaFinDate.setDate(fechaFinDate.getDate() + diasReposo);
                fechaFin = fechaFinDate.toISOString();
            }
        }
        
        const mappedCertificate = {
            id: cert.id,
            id_encriptado: cert.id_encriptado,
            tipo_certificado: tipoCertificado,
            fecha_emision: cert.fecha_emision,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            dias_reposo: diasReposo,
            estado: determineCertificateStatus(cert, fechaFin),
            medico_emisor: cert.medico_nombre_completo || `Matrícula: ${cert.matricprescr}`,
            medico_nombre: cert.medico_nombre,
            medico_apellido: cert.medico_apellido,
            centro_medico: cert.lugaratencion || null,
            observaciones: cert.diagnostico2 || null,
            matricula_prescriptor: cert.matricprescr,
            matricula_especialidad: cert.matricespec_prescr,
            ip_prescriptor: cert.ipprescriptor,
            device: cert.device,
            original_data: {
                diagnostico: cert.diagnostico,
                diagnostico2: cert.diagnostico2,
                estado: cert.estado
            }
        };
        
        console.log(`🏥 [CERTIFICATE-BY-ID] Certificado encontrado:`, {
            id: cert.id,
            tipo: tipoCertificado,
            paciente: `${cert.paciente_nombre} ${cert.paciente_apellido}`
        });
        
        res.json({
            success: true,
            patient: {
                id: cert.idpaciente,
                dni: cert.dni,
                nombre: cert.paciente_nombre,
                apellido: cert.paciente_apellido,
                sexo: cert.sexo,
                fecnac: cert.fecnac
            },
            certificate: mappedCertificate
        });
        
    } catch (error) {
        console.error('❌ [CERTIFICATE-BY-ID] Error al obtener certificado por ID:', error);
        res.status(500).json({
            error: 'Error al obtener el certificado',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Función auxiliar para determinar el estado del certificado
 * @param {Object} cert - Objeto certificado
 * @param {string|null} fechaFin - Fecha de finalización
 * @returns {string} - Estado del certificado
 */
const determineCertificateStatus = (cert, fechaFin) => {
    // Si hay motivo de anulación, está cancelado
    if (cert.anulacionmotivo) {
        return 'CANCELADO';
    }
    
    // Si hay estado explícito en la BD, usarlo
    if (cert.estado) {
        return cert.estado.toUpperCase();
    }
    
    // Si es certificado de reposo y tiene fecha fin, verificar si venció
    if (fechaFin) {
        const fechaFinDate = new Date(fechaFin);
        const hoy = new Date();
        if (fechaFinDate < hoy) {
            return 'VENCIDO';
        }
    }
    
    return 'VIGENTE';
};

module.exports = {
    getCertificatesByDNI,
    getCertificatesByPatientId,
    getCertificateByEncryptedId
};