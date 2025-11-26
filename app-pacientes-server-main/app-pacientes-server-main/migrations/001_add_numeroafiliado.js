const { executeQuery } = require('../config/database');

async function up() {
    console.log('🔧 Ejecutando migración: Agregar columna numeroafiliado...');
    
    try {
        await executeQuery(`
            ALTER TABLE rec_paciente 
            ADD COLUMN numeroafiliado VARCHAR(100) NULL
        `);
        
        console.log('✅ Migración completada: numeroafiliado agregado');
    } catch (error) {
        if (error.message.includes('Duplicate column')) {
            console.log('ℹ️ La columna numeroafiliado ya existe');
        } else {
            console.error('❌ Error en migración:', error.message);
            throw error;
        }
    }
}

async function down() {
    console.log('🔧 Revirtiendo migración: Eliminar columna numeroafiliado...');
    
    try {
        await executeQuery(`
            ALTER TABLE rec_paciente 
            DROP COLUMN numeroafiliado
        `);
        
        console.log('✅ Migración revertida');
    } catch (error) {
        console.error('❌ Error al revertir migración:', error.message);
        throw error;
    }
}

module.exports = { up, down };