const path = require('path');

async function runMigration(migrationName) {
    console.log(`\n🚀 Ejecutando migración: ${migrationName}\n`);
    
    try {
        const migration = require(path.join(__dirname, migrationName));
        await migration.up();
        console.log('\n✅ Migración ejecutada exitosamente\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error ejecutando migración:', error.message, '\n');
        process.exit(1);
    }
}

const migrationFile = process.argv[2];

if (!migrationFile) {
    console.error('❌ Debe especificar el archivo de migración');
    console.log('Uso: node migrations/run.js 001_add_numeroafiliado.js');
    process.exit(1);
}

runMigration(migrationFile);