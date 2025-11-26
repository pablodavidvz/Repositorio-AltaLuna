// controllers/prescriptionController.js (CON MEDICAMENTOS Y MÉDICOS)
const { executeQuery } = require('../config/database');

/**
 * Obtener recetas de un paciente por DNI escaneado (CON MEDICAMENTOS Y MÉDICOS)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getPrescriptionsByDNI = async (req, res) => {
    const { dni } = req.params;
    
    console.log(`🔍 [PRESCRIPTIONS-DNI] Consultando recetas para DNI: ${dni}`);
    
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
            console.log(`❌ [PRESCRIPTIONS-DNI] Paciente no encontrado con DNI: ${dni}`);
            return res.status(404).json({
                error: 'Paciente no encontrado',
                details: `No se encontró un paciente con DNI: ${dni}`
            });
        }
        
        const patient = patients[0];
        console.log(`👤 [PRESCRIPTIONS-DNI] Paciente encontrado:`, {
            id: patient.id,
            nombre: patient.nombre,
            apellido: patient.apellido,
            dni: patient.dni
        });
        
        // Buscar recetas del paciente CON datos del médico Y medicamentos
        const prescriptionsWithMeds = await executeQuery(`
            SELECT 
                r.*,
                tp.nombre as medico_nombre,
                tp.apellido as medico_apellido,
                CONCAT(tp.nombre, ' ', tp.apellido) as medico_nombre_completo,
                rpm.idrecetamedic,
                rpm.idauditoria,
                rpm.nro_orden,
                rpm.idmedicamento,
                rpm.codigo as medicamento_codigo,
                v.monodroga,
                v.nombre_comercial,
                v.presentacion,
                v.laboratorio,
                CONCAT(v.monodroga, ' - ', v.nombre_comercial, ' (', v.presentacion, ')') as medicamento_completo
            FROM rec_receta r
            LEFT JOIN tmp_person tp ON r.matricprescr = tp.matricula
            LEFT JOIN rec_prescrmedicamento rpm ON r.idreceta = rpm.idreceta
            LEFT JOIN vademecum v ON rpm.codigo = v.codigo
            WHERE r.idpaciente = ? 
            ORDER BY r.idreceta DESC, rpm.nro_orden ASC
        `, [patient.id]);
        
        console.log(`📋 [PRESCRIPTIONS-DNI] Encontradas ${prescriptionsWithMeds.length} filas (recetas con medicamentos)`);
        
        // Agrupar los medicamentos por receta
        const prescriptionsMap = new Map();
        
        prescriptionsWithMeds.forEach(row => {
            const prescriptionId = row.idreceta;
            
            // Si la receta no existe en el mapa, crearla
            if (!prescriptionsMap.has(prescriptionId)) {
                // Datos de la receta base
                const prescription = {
                    idreceta: row.idreceta,
                    num_receta_ofuscada: row.num_receta_ofuscada,
                    fechaemision: row.fechaemision,
                    ipprescriptor: row.ipprescriptor,
                    matricprescr: row.matricprescr,
                    matricespec_prescr: row.matricespec_prescr,
                    idpaciente: row.idpaciente,
                    idobrasocafiliado: row.idobrasocafiliado,
                    lugaratencion: row.lugaratencion,
                    tipo_farmacia_destino: row.tipo_farmacia_destino,
                    diagnostico: row.diagnostico,
                    diagnostico2: row.diagnostico2,
                    bloqueo: row.bloqueo,
                    fech_bloqueo: row.fech_bloqueo,
                    apikeyboqueo: row.apikeyboqueo,
                    identidadreserv: row.identidadreserv,
                    estado: row.estado,
                    anulacionmotivo: row.anulacionmotivo,
                    idespecialidad: row.idespecialidad,
                    device: row.device,
                    empresa: row.empresa,
                    expertoria: row.expertoria,
                    nroRecetaFinanciadora: row.nroRecetaFinanciadora,
                    // Datos del médico
                    medico_nombre: row.medico_nombre,
                    medico_apellido: row.medico_apellido,
                    medico_nombre_completo: row.medico_nombre_completo || `Matrícula: ${row.matricprescr}`,
                    // Array de medicamentos
                    medicamentos: []
                };
                
                prescriptionsMap.set(prescriptionId, prescription);
            }
            
            // Agregar medicamento si existe
            if (row.idrecetamedic) {
                const medicamento = {
                    idrecetamedic: row.idrecetamedic,
                    idauditoria: row.idauditoria,
                    nro_orden: row.nro_orden,
                    idmedicamento: row.idmedicamento,
                    codigo: row.medicamento_codigo,
                    monodroga: row.monodroga,
                    nombre_comercial: row.nombre_comercial,
                    presentacion: row.presentacion,
                    laboratorio: row.laboratorio,
                    medicamento_completo: row.medicamento_completo || `Código: ${row.medicamento_codigo}`
                };
                
                prescriptionsMap.get(prescriptionId).medicamentos.push(medicamento);
            }
        });
        
        // Convertir el mapa a array
        const prescriptions = Array.from(prescriptionsMap.values());
        
        console.log(`📋 [PRESCRIPTIONS-DNI] Procesadas ${prescriptions.length} recetas únicas`);
        console.log(`👨‍⚕️ [PRESCRIPTIONS-DNI] Médicos encontrados:`, 
            prescriptions.slice(0, 2).map(p => ({
                matricula: p.matricprescr,
                medico: p.medico_nombre_completo
            }))
        );
        console.log(`💊 [PRESCRIPTIONS-DNI] Medicamentos encontrados:`, 
            prescriptions.slice(0, 2).map(p => ({
                receta: p.idreceta,
                medicamentos: p.medicamentos.length,
                ejemplos: p.medicamentos.slice(0, 2).map(m => m.medicamento_completo)
            }))
        );
        
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
            count: prescriptions.length,
            prescriptions: prescriptions
        });
        
    } catch (error) {
        console.error('❌ [PRESCRIPTIONS-DNI] Error al obtener recetas por DNI:', error);
        res.status(500).json({
            error: 'Error al obtener las recetas por DNI',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener todas las recetas de un paciente por su ID (CON MEDICAMENTOS Y MÉDICOS)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getPrescriptionsByPatientId = async (req, res) => {
    const { patientId } = req.params;
    
    console.log(`📋 [PRESCRIPTIONS] Consultando recetas para paciente ID: ${patientId}`);
    
    try {
        // Validar que el ID del paciente sea un número
        if (!patientId || isNaN(patientId)) {
            return res.status(400).json({
                error: 'ID de paciente inválido',
                details: 'El ID debe ser un número válido'
            });
        }
        
        // Consultar recetas del paciente CON medicamentos y médicos
        const prescriptionsWithMeds = await executeQuery(`
            SELECT 
                r.*,
                tp.nombre as medico_nombre,
                tp.apellido as medico_apellido,
                CONCAT(tp.nombre, ' ', tp.apellido) as medico_nombre_completo,
                rpm.idrecetamedic,
                rpm.idauditoria,
                rpm.nro_orden,
                rpm.idmedicamento,
                rpm.codigo as medicamento_codigo,
                v.monodroga,
                v.nombre_comercial,
                v.presentacion,
                v.laboratorio,
                CONCAT(v.monodroga, ' - ', v.nombre_comercial, ' (', v.presentacion, ')') as medicamento_completo
            FROM rec_receta r
            LEFT JOIN tmp_person tp ON r.matricprescr = tp.matricula
            LEFT JOIN rec_prescrmedicamento rpm ON r.idreceta = rpm.idreceta
            LEFT JOIN vademecum v ON rpm.codigo = v.codigo
            WHERE r.idpaciente = ? 
            ORDER BY r.idreceta DESC, rpm.nro_orden ASC
        `, [patientId]);
        
        // Agrupar medicamentos por receta (mismo proceso que arriba)
        const prescriptionsMap = new Map();
        
        prescriptionsWithMeds.forEach(row => {
            const prescriptionId = row.idreceta;
            
            if (!prescriptionsMap.has(prescriptionId)) {
                const prescription = {
                    idreceta: row.idreceta,
                    num_receta_ofuscada: row.num_receta_ofuscada,
                    fechaemision: row.fechaemision,
                    matricprescr: row.matricprescr,
                    matricespec_prescr: row.matricespec_prescr,
                    diagnostico: row.diagnostico,
                    diagnostico2: row.diagnostico2,
                    estado: row.estado,
                    medico_nombre_completo: row.medico_nombre_completo || `Matrícula: ${row.matricprescr}`,
                    medicamentos: []
                };
                
                prescriptionsMap.set(prescriptionId, prescription);
            }
            
            if (row.idrecetamedic) {
                const medicamento = {
                    idrecetamedic: row.idrecetamedic,
                    nro_orden: row.nro_orden,
                    codigo: row.medicamento_codigo,
                    monodroga: row.monodroga,
                    nombre_comercial: row.nombre_comercial,
                    presentacion: row.presentacion,
                    laboratorio: row.laboratorio,
                    medicamento_completo: row.medicamento_completo || `Código: ${row.medicamento_codigo}`
                };
                
                prescriptionsMap.get(prescriptionId).medicamentos.push(medicamento);
            }
        });
        
        const prescriptions = Array.from(prescriptionsMap.values());
        
        console.log(`📋 [PRESCRIPTIONS] Encontradas ${prescriptions.length} recetas`);
        
        res.json({
            success: true,
            count: prescriptions.length,
            prescriptions: prescriptions
        });
        
    } catch (error) {
        console.error('❌ [PRESCRIPTIONS] Error al obtener recetas:', error);
        res.status(500).json({
            error: 'Error al obtener las recetas del paciente',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Crear una nueva receta para un paciente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createPrescription = async (req, res) => {
    console.log('📝 [CREATE-PRESCRIPTION] Creando nueva receta:', req.body);
    
    try {
        const requiredFields = ['idpaciente'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios',
                missingFields: missingFields
            });
        }
        
        // Verificar que el paciente existe
        const patients = await executeQuery(
            'SELECT id FROM rec_paciente WHERE id = ?',
            [req.body.idpaciente]
        );
        
        if (patients.length === 0) {
            return res.status(404).json({
                error: 'Paciente no encontrado',
                details: `No se encontró un paciente con ID: ${req.body.idpaciente}`
            });
        }
        
        // Preparar datos para insertar
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);
        const placeholders = fields.map(() => '?').join(', ');
        
        const query = `INSERT INTO rec_receta (${fields.join(', ')}) VALUES (${placeholders})`;
        
        console.log('🔍 [CREATE-PRESCRIPTION] Ejecutando query:', query);
        console.log('🔍 [CREATE-PRESCRIPTION] Valores:', values);
        
        const result = await executeQuery(query, values);
        
        // Obtener la receta recién creada CON datos del médico
        const newPrescription = await executeQuery(`
            SELECT 
                r.*,
                tp.nombre as medico_nombre,
                tp.apellido as medico_apellido,
                CONCAT(tp.nombre, ' ', tp.apellido) as medico_nombre_completo
            FROM rec_receta r
            LEFT JOIN tmp_person tp ON r.matricprescr = tp.matricula
            WHERE r.idreceta = ?
        `, [result.insertId]);
        
        // Agregar array vacío de medicamentos
        if (newPrescription[0]) {
            newPrescription[0].medicamentos = [];
        }
        
        console.log('✅ [CREATE-PRESCRIPTION] Receta creada exitosamente:', newPrescription[0]);
        
        res.status(201).json({
            success: true,
            message: 'Receta creada exitosamente',
            prescription: newPrescription[0]
        });
        
    } catch (error) {
        console.error('❌ [CREATE-PRESCRIPTION] Error al crear receta:', error);
        res.status(500).json({
            error: 'Error al crear la receta',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener todos los estudios médicos de un paciente por DNI
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getStudiesByDNI = async (req, res) => {
    const { dni } = req.params;
    
    console.log(`🔬 [MEDICAL-STUDIES-DNI] Consultando estudios para DNI: ${dni}`);
    
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
            console.log(`❌ [MEDICAL-STUDIES-DNI] Paciente no encontrado con DNI: ${dni}`);
            return res.status(404).json({
                error: 'Paciente no encontrado',
                details: `No se encontró un paciente con DNI: ${dni}`
            });
        }
        
        const patient = patients[0];
        console.log(`👤 [MEDICAL-STUDIES-DNI] Paciente encontrado:`, {
            id: patient.id,
            nombre: patient.nombre,
            apellido: patient.apellido,
            dni: patient.dni
        });
        
        // Buscar estudios médicos del paciente CON datos del médico
        const studies = await executeQuery(`
            SELECT 
                ic.idestudio as id,
                ic.id_encriptado,
                ic.fechaemision as fecha_solicitud,
                ic.ipprescriptor,
                ic.matricprescr,
                ic.matricespec_prescr,
                ic.idpaciente,
                ic.idobrasocafiliado,
                ic.lugaratencion,
                ic.diagnostico,
                ic.diagnostico2,
                ic.estado,
                ic.anulacionmotivo,
                ic.device,
                tp.nombre as medico_nombre,
                tp.apellido as medico_apellido,
                CONCAT(tp.nombre, ' ', tp.apellido) as medico_nombre_completo
            FROM indic_cabecera ic
            LEFT JOIN tmp_person tp ON ic.matricprescr = tp.matricula
            WHERE ic.idpaciente = ?
            ORDER BY ic.fechaemision DESC
        `, [patient.id]);
        
        console.log(`🔬 [MEDICAL-STUDIES-DNI] Encontrados ${studies.length} estudios médicos`);
        
        // Mapear los estudios para que coincidan con la estructura esperada por el frontend
        const mappedStudies = studies.map(study => ({
            id: study.id,
            id_encriptado: study.id_encriptado,
            tipo_estudio: study.diagnostico || 'Estudio Médico',
            fecha_solicitud: study.fecha_solicitud,
            fecha_resultado: null,
            estado: determineStudyStatus(study),
            medico_solicitante: study.medico_nombre_completo || `Matrícula: ${study.matricprescr}`,
            medico_nombre: study.medico_nombre,
            medico_apellido: study.medico_apellido,
            centro_medico: study.lugaratencion ? `Centro ${study.lugaratencion}` : null,
            observaciones: study.diagnostico2 || null,
            matricula_prescriptor: study.matricprescr,
            matricula_especialidad: study.matricespec_prescr,
            ip_prescriptor: study.ipprescriptor,
            device: study.device,
            archivo_resultado: null,
            original_data: {
                diagnostico: study.diagnostico,
                diagnostico2: study.diagnostico2,
                estado: study.estado,
                anulacionmotivo: study.anulacionmotivo
            }
        }));
        
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
            count: mappedStudies.length,
            studies: mappedStudies
        });
        
    } catch (error) {
        console.error('❌ [MEDICAL-STUDIES-DNI] Error al obtener estudios por DNI:', error);
        res.status(500).json({
            error: 'Error al obtener los estudios médicos por DNI',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Función auxiliar para determinar el estado del estudio
 * @param {Object} study - Objeto estudio
 * @returns {string} - Estado del estudio
 */
const determineStudyStatus = (study) => {
    if (study.anulacionmotivo) {
        return 'ANULADO';
    }
    
    if (study.estado) {
        return study.estado.toUpperCase();
    }
    
    return 'COMPLETADO';
};

module.exports = {
    getPrescriptionsByPatientId,
    getPrescriptionsByDNI,
    createPrescription,
    getStudiesByDNI
};