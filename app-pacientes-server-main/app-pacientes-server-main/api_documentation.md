# 📋 API Documentación - Servidor de Pacientes

## 🌐 Información General

- **Base URL**: `http://localhost:8000/app-pacientes-server`
- **Versión**: 2.0.0
- **Formato de respuesta**: JSON
- **Autenticación**: No requerida (por ahora)

## 📊 Estructura de Respuestas

### Respuesta Exitosa
```json
{
  "success": true,
  "data": {...},
  "message": "Descripción del resultado"
}
```

### Respuesta de Error
```json
{
  "error": "Descripción del error",
  "details": "Información adicional (solo en desarrollo)",
  "timestamp": "2025-01-XX T XX:XX:XX.XXXZ"
}
```

## 🔍 Endpoints de Estado

### GET /status
**Descripción**: Verificar el estado del servidor

**Respuesta**:
```json
{
  "message": "API del servidor de Pacientes funcionando correctamente",
  "environment": "development",
  "timestamp": "2025-01-XX T XX:XX:XX.XXXZ",
  "version": "2.0.0",
  "endpoints": {
    "patients": "/app-pacientes-server/api/patients",
    "prescriptions": "/app-pacientes-server/api/prescriptions"
  }
}
```

## 👤 Endpoints de Pacientes

### GET /api/patients/check/:dni
**Descripción**: Verificar si existe un paciente por DNI

**Parámetros**:
- `dni` (string): DNI del paciente

**Headers opcionales**:
- `x-dni-data` (JSON string): Datos del DNI escaneado para actualización automática

**Respuesta - Paciente encontrado**:
```json
{
  "exists": true,
  "patient": {
    "id": 123,
    "dni": "12345678",
    "nombre": "Juan",
    "apellido": "Pérez",
    "sexo": "M",
    "fecnac": "1990-01-15",
    "email": "juan@email.com",
    "telefono": "1234567890"
  },
  "updated": false
}
```

**Respuesta - Paciente no encontrado**:
```json
{
  "exists": false
}
```

### POST /api/patients
**Descripción**: Registrar nuevo paciente

**Body requerido**:
```json
{
  "dni": "12345678",
  "nombre": "Juan",
  "apellido": "Pérez",
  "sexo": "M"
}
```

**Body opcional (campos adicionales)**:
```json
{
  "fecnac": "1990-01-15",
  "email": "juan@email.com",
  "telefono": "1234567890",
  "calle": "Av. Principal",
  "numero": "123",
  "ciudad": "Buenos Aires",
  "provincia": "Buenos Aires"
}
```

**Respuesta**:
```json
{
  "success": true,
  "patient": {
    "id": 124,
    "dni": "12345678",
    "nombre": "Juan",
    "apellido": "Pérez",
    "sexo": "M",
    "fecnac": "1990-01-15"
  }
}
```

### PUT /api/patients/:id
**Descripción**: Actualizar datos de paciente (actualización manual)

**Parámetros**:
- `id` (number): ID del paciente

**Body (campos permitidos)**:
```json
{
  "email": "nuevo@email.com",
  "telefono": "0987654321",
  "calle": "Nueva Calle",
  "numero": "456",
  "ciudad": "La Plata"
}
```

**Respuesta**:
```json
{
  "success": true,
  "patient": {
    "id": 123,
    "dni": "12345678",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "nuevo@email.com",
    "telefono": "0987654321"
  }
}
```

### PUT /api/patients/:id/dni-update
**Descripción**: Actualizar paciente con datos del DNI escaneado

**Parámetros**:
- `id` (number): ID del paciente

**Body (solo campos del DNI)**:
```json
{
  "nombre": "Juan Carlos",
  "apellido": "Pérez García",
  "fecnac": "1990-01-15"
}
```

**Respuesta**:
```json
{
  "success": true,
  "patient": {
    "id": 123,
    "dni": "12345678",
    "nombre": "Juan Carlos",
    "apellido": "Pérez García",
    "fecnac": "1990-01-15"
  },
  "message": "Datos actualizados desde DNI escaneado"
}
```

## 📋 Endpoints de Recetas

### GET /api/prescriptions/dni/:dni
**Descripción**: Obtener todas las recetas de un paciente por DNI ⭐ **PRINCIPAL**

**Parámetros**:
- `dni` (string): DNI del paciente

**Respuesta**:
```json
{
  "success": true,
  "patient": {
    "id": 123,
    "dni": "12345678",
    "nombre": "Juan",
    "apellido": "Pérez",
    "sexo": "M",
    "fecnac": "1990-01-15"
  },
  "count": 2,
  "prescriptions": [
    {
      "idreceta": 1,
      "idpaciente": 123,
      "num_receta_ofuscada": "REC-001-XXXX",
      "fechavencimiento": "2025-02-15",
      "descripcion": "Ibuprofeno 600mg",
      "matricpresc": "12345",
      "diagnostico": "Dolor de cabeza",
      "estado": "ACTIVA",
      "fecha": "2025-01-15"
    }
  ]
}
```

### GET /api/prescriptions/patient/:patientId
**Descripción**: Obtener todas las recetas de un paciente por ID

**Parámetros**:
- `patientId` (number): ID del paciente

**Respuesta**:
```json
{
  "success": true,
  "count": 2,
  "prescriptions": [
    {
      "idreceta": 1,
      "idpaciente": 123,
      "descripcion": "Ibuprofeno 600mg",
      "fecha": "2025-01-15",
      "estado": "ACTIVA"
    }
  ]
}
```

### POST /api/prescriptions
**Descripción**: Crear una nueva receta

**Body requerido**:
```json
{
  "idpaciente": 123
}
```

**Body opcional (campos adicionales)**:
```json
{
  "num_receta_ofuscada": "REC-002-XXXX",
  "fechavencimiento": "2025-03-15",
  "descripcion": "Paracetamol 500mg",
  "matricpresc": "12345",
  "diagnostico": "Fiebre",
  "estado": "ACTIVA"
}
```

**Respuesta**:
```json
{
  "success": true,
  "message": "Receta creada exitosamente",
  "prescription": {
    "idreceta": 2,
    "idpaciente": 123,
    "descripcion": "Paracetamol 500mg",
    "fecha": "2025-01-16",
    "estado": "ACTIVA"
  }
}
```

### PUT /api/prescriptions/:prescriptionId
**Descripción**: Actualizar una receta existente

**Parámetros**:
- `prescriptionId` (number): ID de la receta

**Body (campos permitidos)**:
```json
{
  "descripcion": "Ibuprofeno 400mg (dosis reducida)",
  "fechavencimiento": "2025-02-20",
  "diagnostico": "Dolor de cabeza leve",
  "estado": "MODIFICADA"
}
```

**Respuesta**:
```json
{
  "success": true,
  "message": "Receta actualizada exitosamente",
  "prescription": {
    "idreceta": 1,
    "idpaciente": 123,
    "descripcion": "Ibuprofeno 400mg (dosis reducida)",
    "estado": "MODIFICADA"
  }
}
```

### DELETE /api/prescriptions/:prescriptionId
**Descripción**: Eliminar una receta (soft delete)

**Parámetros**:
- `prescriptionId` (number): ID de la receta

**Respuesta**:
```json
{
  "success": true,
  "message": "Receta eliminada exitosamente"
}
```

## 🔮 Endpoints Futuros (Placeholders)

### GET /api/patients/:id/appointments
**Descripción**: Obtener citas médicas del paciente (En desarrollo)

### GET /api/patients/:id/medical-tests
**Descripción**: Obtener estudios médicos del paciente (En desarrollo)

## ⚠️ Códigos de Error

- **400**: Bad Request - Datos inválidos o faltantes
- **404**: Not Found - Recurso no encontrado
- **409**: Conflict - Recurso duplicado
- **500**: Internal Server Error - Error interno del servidor
- **503**: Service Unavailable - Error de conexión a base de datos

## 🔧 Headers Especiales

### x-dni-data
**Descripción**: Datos del DNI escaneado para actualización automática
**Formato**: JSON string
**Ejemplo**:
```json
{
  "dni": "12345678",
  "nombre": "Juan Carlos",
  "apellido": "Pérez García",
  "genero": "M",
  "fechaNac": "15/01/1990"
}
```

## 🚀 Ejemplos de Uso

### Flujo Principal: Consultar Recetas por DNI Escaneado

1. **Escanear DNI** y obtener datos
2. **Verificar paciente**: `GET /api/patients/check/12345678`
3. **Obtener recetas**: `GET /api/prescriptions/dni/12345678`

### Flujo Secundario: Registrar Nuevo Paciente

1. **Verificar DNI**: `GET /api/patients/check/87654321`
2. **Si no existe, crear**: `POST /api/patients`
3. **Crear primera receta**: `POST /api/prescriptions`

## 📱 Integración con Postman

Importar la colección de Postman incluida en `docs/Postman_Collection.json` para probar todos los endpoints automáticamente.