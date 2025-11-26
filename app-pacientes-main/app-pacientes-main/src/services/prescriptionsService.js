/**
 * Servicio para manejar las operaciones relacionadas con recetas médicas
 * Utiliza la API del servidor de pacientes documentada
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/app-pacientes-server';

class PrescriptionsService {
  /**
   * Obtener todas las recetas de un paciente por DNI (Endpoint principal)
   * @param {string} dni - DNI del paciente
   * @returns {Promise<Object>} Resultado con las recetas del paciente
   */
  async getPrescriptionsByDni(dni) {
    try {
      console.log(`📋 Consultando recetas para DNI: ${dni}`);
      
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/dni/${dni}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'No se encontraron recetas para este DNI',
            patient: null,
            prescriptions: [],
            count: 0
          };
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.success || true,
        patient: data.patient || null,
        prescriptions: data.prescriptions || [],
        count: data.count || 0,
        error: null
      };

    } catch (error) {
      console.error('❌ Error al obtener recetas por DNI:', error);
      
      return {
        success: false,
        error: error.message || 'Error al consultar las recetas',
        patient: null,
        prescriptions: [],
        count: 0
      };
    }
  }

  /**
   * Obtener todas las recetas de un paciente por ID
   * @param {number} patientId - ID del paciente
   * @returns {Promise<Object>} Resultado con las recetas del paciente
   */
  async getPrescriptionsByPatientId(patientId) {
    try {
      console.log(`📋 Consultando recetas para paciente ID: ${patientId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/patient/${patientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'No se encontraron recetas para este paciente',
            prescriptions: [],
            count: 0
          };
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.success || true,
        prescriptions: data.prescriptions || [],
        count: data.count || 0,
        error: null
      };

    } catch (error) {
      console.error('❌ Error al obtener recetas por ID del paciente:', error);
      
      return {
        success: false,
        error: error.message || 'Error al consultar las recetas',
        prescriptions: [],
        count: 0
      };
    }
  }

  /**
   * Crear una nueva receta
   * @param {Object} prescriptionData - Datos de la receta
   * @returns {Promise<Object>} Resultado de la creación
   */
  async createPrescription(prescriptionData) {
    try {
      console.log('📝 Creando nueva receta:', prescriptionData);
      
      const response = await fetch(`${API_BASE_URL}/api/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prescriptionData)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.success || true,
        prescription: data.prescription || null,
        message: data.message || 'Receta creada exitosamente',
        error: null
      };

    } catch (error) {
      console.error('❌ Error al crear receta:', error);
      
      return {
        success: false,
        error: error.message || 'Error al crear la receta',
        prescription: null,
        message: null
      };
    }
  }

  /**
   * Actualizar una receta existente
   * @param {number} prescriptionId - ID de la receta
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} Resultado de la actualización
   */
  async updatePrescription(prescriptionId, updateData) {
    try {
      console.log(`✏️ Actualizando receta ID: ${prescriptionId}`, updateData);
      
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/${prescriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.success || true,
        prescription: data.prescription || null,
        message: data.message || 'Receta actualizada exitosamente',
        error: null
      };

    } catch (error) {
      console.error('❌ Error al actualizar receta:', error);
      
      return {
        success: false,
        error: error.message || 'Error al actualizar la receta',
        prescription: null,
        message: null
      };
    }
  }

  /**
   * Eliminar una receta (soft delete)
   * @param {number} prescriptionId - ID de la receta
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deletePrescription(prescriptionId) {
    try {
      console.log(`🗑️ Eliminando receta ID: ${prescriptionId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/${prescriptionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.success || true,
        message: data.message || 'Receta eliminada exitosamente',
        error: null
      };

    } catch (error) {
      console.error('❌ Error al eliminar receta:', error);
      
      return {
        success: false,
        error: error.message || 'Error al eliminar la receta',
        message: null
      };
    }
  }

  /**
   * Validar el estado de una receta
   * @param {Object} prescription - Objeto de receta
   * @returns {Object} Información del estado
   */
  validatePrescriptionStatus(prescription) {
    if (!prescription) {
      return {
        isValid: false,
        status: 'invalid',
        message: 'Receta no válida'
      };
    }

    const estado = prescription.estado?.toUpperCase();
    const fechaVencimiento = prescription.fechavencimiento;
    const hoy = new Date();
    const vencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null;

    // Verificar si está eliminada
    if (estado === 'ELIMINADA') {
      return {
        isValid: false,
        status: 'deleted',
        message: 'Receta eliminada'
      };
    }

    // Verificar si está vencida
    if (vencimiento && vencimiento < hoy) {
      return {
        isValid: false,
        status: 'expired',
        message: 'Receta vencida'
      };
    }

    // Verificar si está activa
    if (estado === 'ACTIVA') {
      return {
        isValid: true,
        status: 'active',
        message: 'Receta activa'
      };
    }

    // Estado desconocido
    return {
      isValid: false,
      status: 'unknown',
      message: `Estado desconocido: ${estado || 'Sin estado'}`
    };
  }

  /**
   * Formatear fecha para mostrar
   * @param {string} dateString - Fecha en formato string
   * @returns {string} Fecha formateada
   */
  formatDate(dateString) {
    if (!dateString) return 'No especificada';
    
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error al formatear fecha:', error);
      return dateString;
    }
  }

  /**
   * Verificar si el servidor está disponible
   * @returns {Promise<boolean>} True si el servidor responde
   */
  async checkServerStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Error al verificar estado del servidor:', error);
      return false;
    }
  }
}

// Crear y exportar una instancia del servicio
const prescriptionsService = new PrescriptionsService();
export default prescriptionsService;