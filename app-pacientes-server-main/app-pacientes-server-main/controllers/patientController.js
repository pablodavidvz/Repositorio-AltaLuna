// controllers/patientController.js
const { executeQuery } = require('../config/database');
const { formatDateToISO } = require('../utils/dateFormatter');

/**
 * Verificar paciente por DNI
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const checkPatientByDNI = async (req, res) => {
    const { dni } = req.params;
    
    console.log(`🔍 [CHECK-PATIENT] Verificando paciente con DNI: ${dni}`);
    
    try {
        // Consulta SQL para buscar un paciente por DNI
        const rows = await executeQuery(
            'SELECT * FROM rec_paciente WHERE dni = ?',
            [dni]
        );

        if (rows.length > 0) {
            const patient = rows[0];
            console.log(`👤 [CHECK-PATIENT] Paciente encontrado:`, {
                id: patient.id,
                dni: patient.dni,
                nombre: patient.nombre,
                apellido: patient.apellido
            });

            // Verificar si hay datos del DNI en los headers
            const dniData = req.headers['x-dni-data'] ? JSON.parse(req.headers['x-dni-data']) : null;

            let updatedPatient = patient;
            let wasUpdated = false;

            // Si hay datos del DNI escaneado, verificar si necesita actualización
            if (dniData && dniData.dni === dni) {
                console.log('🔍 [CHECK-PATIENT] Verificando si necesita actualización automática...');
                
                // Verificar que coincidan DNI y sexo (medidas de seguridad)
                const dniMatches = String(patient.dni) === String(dniData.dni);
                const sexMatches = patient.sexo === dniData.genero;

                if (dniMatches && sexMatches) {
                    // Verificar si hay diferencias en los datos
                    const nameChanged = patient.nombre !== dniData.nombre;
                    const lastNameChanged = patient.apellido !== dniData.apellido;
                    const dniDate = formatDateToISO(dniData.fechaNac);
                    const dateChanged = dniDate && patient.fecnac !== dniDate;

                    if (nameChanged || lastNameChanged || dateChanged) {
                        console.log('🚀 [CHECK-PATIENT] Actualizando datos automáticamente...');

                        // Preparar datos para actualizar
                        const updateData = {};
                        if (nameChanged) updateData.nombre = dniData.nombre;
                        if (lastNameChanged) updateData.apellido = dniData.apellido;
                        if (dateChanged) updateData.fecnac = dniDate;

                        // Construir la consulta de actualización
                        const setClause = Object.keys(updateData)
                            .map(field => `${field} = ?`)
                            .join(', ');
                        const values = [...Object.values(updateData), patient.id];
                        const updateQuery = `UPDATE rec_paciente SET ${setClause} WHERE id = ?`;

                        // Ejecutar la actualización
                        await executeQuery(updateQuery, values);

                        // Obtener el paciente actualizado
                        const updatedRows = await executeQuery(
                            'SELECT * FROM rec_paciente WHERE id = ?',
                            [patient.id]
                        );

                        if (updatedRows.length > 0) {
                            updatedPatient = updatedRows[0];
                            wasUpdated = true;
                            console.log('✅ [CHECK-PATIENT] Paciente actualizado exitosamente');
                        }
                    }
                }
            }

            res.json({
                exists: true,
                patient: updatedPatient,
                updated: wasUpdated
            });
        } else {
            console.log(`❌ [CHECK-PATIENT] Paciente no encontrado con DNI: ${dni}`);
            res.json({
                exists: false
            });
        }
    } catch (error) {
        console.error('❌ [CHECK-PATIENT] Error al verificar paciente por DNI:', error);
        res.status(500).json({
            error: 'Error al verificar el paciente',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Registrar nuevo paciente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createPatient = async (req, res) => {
    console.log('👤 [CREATE-PATIENT] Registrando nuevo paciente:', req.body);
    
    try {
        // Validar datos mínimos requeridos
        const { dni, nombre, apellido, sexo } = req.body;

        if (!dni || !nombre || !apellido || !sexo) {
            return res.status(400).json({
                error: 'Faltan datos obligatorios (dni, nombre, apellido, sexo)'
            });
        }

        // Verificar si ya existe un paciente con ese DNI
        const existingPatients = await executeQuery(
            'SELECT * FROM rec_paciente WHERE dni = ?',
            [dni]
        );

        if (existingPatients.length > 0) {
            return res.status(409).json({
                error: 'Ya existe un paciente con ese DNI'
            });
        }

        // Preparar la consulta SQL para insertar un nuevo paciente
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);
        const placeholders = fields.map(() => '?').join(', ');

        const query = `INSERT INTO rec_paciente (${fields.join(', ')}) VALUES (${placeholders})`;

        // Ejecutar la consulta
        const result = await executeQuery(query, values);

        // Obtener el paciente recién creado
        const newPatient = await executeQuery(
            'SELECT * FROM rec_paciente WHERE id = ?',
            [result.insertId]
        );

        console.log('✅ [CREATE-PATIENT] Paciente registrado exitosamente');

        res.status(201).json({
            success: true,
            patient: newPatient[0]
        });
    } catch (error) {
        console.error('❌ [CREATE-PATIENT] Error al registrar paciente:', error);
        res.status(500).json({
            error: 'Error al registrar el paciente',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Actualizar paciente (actualización manual desde perfil)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updatePatient = async (req, res) => {
    const { id } = req.params;
    
    console.log(`📝 [UPDATE-PATIENT] Actualizando paciente ID: ${id}`);
    
    try {
        // Verificar si el paciente existe
        const existingPatients = await executeQuery(
            'SELECT * FROM rec_paciente WHERE id = ?',
            [id]
        );

        if (existingPatients.length === 0) {
            return res.status(404).json({
                error: 'Paciente no encontrado'
            });
        }

        // Filtrar campos permitidos para actualizar
        const allowedFields = [
            'email', 'telefono', 'calle', 'numero', 'piso', 'departamento',
            'cpostal', 'barrio', 'ciudad', 'provincia', 'peso', 'talla'
        ];

        const updateData = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        // Si no hay campos para actualizar
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: 'No se proporcionaron campos válidos para actualizar'
            });
        }

        // Construir la consulta de actualización
        const setClause = Object.keys(updateData)
            .map(field => `${field} = ?`)
            .join(', ');

        const values = [...Object.values(updateData), id];
        const query = `UPDATE rec_paciente SET ${setClause} WHERE id = ?`;

        // Ejecutar la consulta
        await executeQuery(query, values);

        // Obtener el paciente actualizado
        const updatedPatient = await executeQuery(
            'SELECT * FROM rec_paciente WHERE id = ?',
            [id]
        );

        console.log('✅ [UPDATE-PATIENT] Paciente actualizado exitosamente');

        res.json({
            success: true,
            patient: updatedPatient[0]
        });
    } catch (error) {
        console.error('❌ [UPDATE-PATIENT] Error al actualizar paciente:', error);
        res.status(500).json({
            error: 'Error al actualizar el paciente',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Actualizar paciente con datos del DNI escaneado
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updatePatientWithDNI = async (req, res) => {
    const { id } = req.params;
    
    console.log('🔄 [DNI-UPDATE] Solicitud recibida para paciente ID:', id);
    console.log('🔄 [DNI-UPDATE] Datos recibidos:', req.body);

    try {
        // Verificar si el paciente existe
        const existingPatients = await executeQuery(
            'SELECT * FROM rec_paciente WHERE id = ?',
            [id]
        );

        if (existingPatients.length === 0) {
            console.log('❌ [DNI-UPDATE] Paciente no encontrado con ID:', id);
            return res.status(404).json({
                error: 'Paciente no encontrado'
            });
        }

        const existingPatient = existingPatients[0];

        // Solo permitir actualizar campos que vienen del DNI
        const allowedDniFields = ['nombre', 'apellido', 'sexo', 'fecnac'];
        const updateData = {};

        for (const field of allowedDniFields) {
            if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '') {
                updateData[field] = req.body[field];
            }
        }

        // Si no hay campos para actualizar
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: 'No se proporcionaron campos válidos del DNI para actualizar'
            });
        }

        // Verificar que el sexo coincida (medida de seguridad)
        if (updateData.sexo && existingPatient.sexo !== updateData.sexo) {
            return res.status(400).json({
                error: 'El sexo del DNI no coincide con el paciente existente'
            });
        }

        // Construir la consulta de actualización
        const setClause = Object.keys(updateData)
            .map(field => `${field} = ?`)
            .join(', ');

        const values = [...Object.values(updateData), id];
        const query = `UPDATE rec_paciente SET ${setClause} WHERE id = ?`;

        // Ejecutar la consulta
        await executeQuery(query, values);

        // Obtener el paciente actualizado
        const updatedPatient = await executeQuery(
            'SELECT * FROM rec_paciente WHERE id = ?',
            [id]
        );

        console.log('🎉 [DNI-UPDATE] Paciente actualizado exitosamente');

        res.json({
            success: true,
            patient: updatedPatient[0],
            message: 'Datos actualizados desde DNI escaneado'
        });
    } catch (error) {
        console.error('❌ [DNI-UPDATE] Error al actualizar paciente con datos del DNI:', error);
        res.status(500).json({
            error: 'Error al actualizar el paciente con datos del DNI',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    checkPatientByDNI,
    createPatient,
    updatePatient,
    updatePatientWithDNI
};