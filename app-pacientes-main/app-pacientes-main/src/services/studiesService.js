/**
 * Servicio para manejar las operaciones relacionadas con estudios médicos
 * Utiliza la API del servidor de pacientes documentada
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/app-pacientes-server';

class StudiesService {
  /**
   * Obtener todos los estudios de un paciente por DNI (Endpoint principal)
   * @param {string} dni - DNI del paciente
   * @returns {Promise<Object>} Resultado con los estudios del paciente
   */
  async getStudiesByDni(dni) {
    try {
      console.log(`📊 Consultando estudios para DNI: ${dni}`);
      
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/studies/dni/${dni}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'No se encontraron estudios para este DNI',
            patient: null,
            studies: [],
            count: 0
          };
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.success || true,
        patient: data.patient || null,
        studies: data.studies || [],
        count: data.count || 0,
        error: null
      };

    } catch (error) {
      console.error('❌ Error al obtener estudios por DNI:', error);
      
      return {
        success: false,
        error: error.message || 'Error al consultar los estudios',
        patient: null,
        studies: [],
        count: 0
      };
    }
  }

  /**
   * Obtener todos los estudios de un paciente por ID
   * @param {number} patientId - ID del paciente
   * @returns {Promise<Object>} Resultado con los estudios del paciente
   */
  async getStudiesByPatientId(patientId) {
    try {
      console.log(`📊 Consultando estudios para paciente ID: ${patientId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/studies/patient/${patientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'No se encontraron estudios para este paciente',
            studies: [],
            count: 0
          };
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.success || true,
        studies: data.studies || [],
        count: data.count || 0,
        error: null
      };

    } catch (error) {
      console.error('❌ Error al obtener estudios por ID del paciente:', error);
      
      return {
        success: false,
        error: error.message || 'Error al consultar los estudios',
        studies: [],
        count: 0
      };
    }
  }

  /**
   * Obtener un estudio específico por ID encriptado
   * @param {string} encryptedId - ID encriptado del estudio
   * @returns {Promise<Object>} Resultado con el estudio
   */
  async getStudyByEncryptedId(encryptedId) {
    try {
      console.log(`📄 Consultando estudio ID: ${encryptedId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/studies/study/${encryptedId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'No se encontró el estudio solicitado',
            study: null
          };
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.success || true,
        study: data.study || null,
        error: null
      };

    } catch (error) {
      console.error('❌ Error al obtener estudio por ID:', error);
      
      return {
        success: false,
        error: error.message || 'Error al consultar el estudio',
        study: null
      };
    }
  }

  /**
   * Determinar el estado visual de un estudio médico
   * @param {Object} study - Objeto del estudio
   * @returns {Object} Información del estado visual
   */
  getStudyStatusInfo(study) {
    if (!study) {
      return {
        color: 'text-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-800',
        icon: 'FaInfoCircle',
        label: 'Desconocido',
        description: 'Estado del estudio no disponible'
      };
    }

    const estado = study.estado?.toUpperCase();
    const fechaResultado = study.fecha_resultado;
    
    switch (estado) {
      case 'COMPLETADO':
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: 'FaCheckCircle',
          label: 'Completado',
          description: 'Estudio completado y disponible'
        };
      
      case 'EN_PROCESO':
        return {
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          icon: 'FaClock',
          label: 'En Proceso',
          description: 'Estudio en proceso de realización'
        };
        
      case 'PENDIENTE':
        return {
          color: 'text-orange-500',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          icon: 'FaClock',
          label: 'Pendiente',
          description: 'Estudio pendiente de realización'
        };
        
      case 'CANCELADO':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: 'FaExclamationTriangle',
          label: 'Cancelado',
          description: 'Estudio cancelado'
        };
        
      default:
        return {
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          icon: 'FaInfoCircle',
          label: estado || 'Sin Estado',
          description: 'Estado del estudio'
        };
    }
  }

  /**
   * Generar URL de descarga del resultado del estudio
   * @param {string} idEncriptado - ID encriptado del estudio (ej: 73b9dbe8-912b-4813-9d30-c83d7b96dd96.pdf)
   * @returns {string|null} URL de descarga o null si no hay archivo
   */
  getStudyDownloadUrl(idEncriptado) {
    if (!idEncriptado) return null;
    return `https://aplicaciones.cmpc.org.ar/receta/estudios/tmp/${idEncriptado}`;
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
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Error al formatear fecha:', error);
      return dateString;
    }
  }

  /**
   * Formatear solo fecha (sin hora)
   * @param {string} dateString - Fecha en formato string
   * @returns {string} Fecha formateada
   */
  formatDateOnly(dateString) {
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
   * Verificar si un estudio tiene resultado disponible
   * @param {Object} study - Objeto del estudio
   * @returns {boolean} True si tiene resultado disponible
   */
  hasResultAvailable(study) {
    return study?.estado === 'COMPLETADO' && 
           (study.id_encriptado || study.fecha_resultado);
  }

  /**
   * Obtener información del médico solicitante
   * @param {Object} study - Objeto del estudio
   * @returns {string} Nombre completo del médico
   */
  getDoctorInfo(study) {
    if (!study) return 'No especificado';
    
    if (study.medico_solicitante) {
      return `Dr. ${study.medico_solicitante}`;
    }
    
    if (study.medico_nombre && study.medico_apellido) {
      return `Dr. ${study.medico_nombre} ${study.medico_apellido}`;
    }
    
    if (study.matricula_prescriptor) {
      return `MP: ${study.matricula_prescriptor}`;
    }
    
    return 'No especificado';
  }

  /**
   * Validar si un estudio es válido
   * @param {Object} study - Objeto del estudio
   * @returns {Object} Información de validación
   */
  validateStudy(study) {
    if (!study) {
      return {
        isValid: false,
        issues: ['Estudio no válido']
      };
    }

    const issues = [];
    
    if (!study.tipo_estudio) {
      issues.push('Tipo de estudio no especificado');
    }
    
    if (!study.fecha_solicitud) {
      issues.push('Fecha de solicitud no especificada');
    }
    
    if (!study.medico_solicitante && !study.matricula_prescriptor) {
      issues.push('Médico solicitante no especificado');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
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
const studiesService = new StudiesService();
export default studiesService;