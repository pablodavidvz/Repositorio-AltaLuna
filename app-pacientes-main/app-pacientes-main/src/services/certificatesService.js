/**
 * Servicio para manejar las operaciones relacionadas con certificados médicos
 * Utiliza la API del servidor de pacientes documentada
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/app-pacientes-server';

class CertificatesService {
  /**
   * Obtener todos los certificados de un paciente por DNI (Endpoint principal)
   * @param {string} dni - DNI del paciente
   * @returns {Promise<Object>} Resultado con los certificados del paciente
   */
  async getCertificatesByDni(dni) {
    try {
      console.log(`📜 Consultando certificados para DNI: ${dni}`);
      
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/certificates/dni/${dni}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'No se encontraron certificados para este DNI',
            patient: null,
            certificates: [],
            count: 0
          };
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.success || true,
        patient: data.patient || null,
        certificates: data.certificates || [],
        count: data.count || 0,
        error: null
      };

    } catch (error) {
      console.error('❌ Error al obtener certificados por DNI:', error);
      
      return {
        success: false,
        error: error.message || 'Error al consultar los certificados',
        patient: null,
        certificates: [],
        count: 0
      };
    }
  }

  /**
   * Obtener todos los certificados de un paciente por ID
   * @param {number} patientId - ID del paciente
   * @returns {Promise<Object>} Resultado con los certificados del paciente
   */
  async getCertificatesByPatientId(patientId) {
    try {
      console.log(`📜 Consultando certificados para paciente ID: ${patientId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/certificates/patient/${patientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'No se encontraron certificados para este paciente',
            certificates: [],
            count: 0
          };
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.success || true,
        certificates: data.certificates || [],
        count: data.count || 0,
        error: null
      };

    } catch (error) {
      console.error('❌ Error al obtener certificados por ID del paciente:', error);
      
      return {
        success: false,
        error: error.message || 'Error al consultar los certificados',
        certificates: [],
        count: 0
      };
    }
  }

  /**
   * Obtener un certificado específico por ID encriptado
   * @param {string} encryptedId - ID encriptado del certificado
   * @returns {Promise<Object>} Resultado con el certificado
   */
  async getCertificateByEncryptedId(encryptedId) {
    try {
      console.log(`📄 Consultando certificado ID: ${encryptedId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/certificates/certificate/${encryptedId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'No se encontró el certificado solicitado',
            certificate: null
          };
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.success || true,
        certificate: data.certificate || null,
        error: null
      };

    } catch (error) {
      console.error('❌ Error al obtener certificado por ID:', error);
      
      return {
        success: false,
        error: error.message || 'Error al consultar el certificado',
        certificate: null
      };
    }
  }

  /**
   * Determinar el estado visual de un certificado médico
   * @param {Object} certificate - Objeto del certificado
   * @returns {Object} Información del estado visual
   */
  getCertificateStatusInfo(certificate) {
    if (!certificate) {
      return {
        color: 'text-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-800',
        icon: 'FaInfoCircle',
        label: 'Desconocido',
        description: 'Estado del certificado no disponible'
      };
    }

    const estado = certificate.estado?.toUpperCase();
    const fechaFin = certificate.fecha_fin ? new Date(certificate.fecha_fin) : null;
    const ahora = new Date();
    
    switch (estado) {
      case 'VIGENTE':
        // Verificar si está vencido por fecha
        if (fechaFin && fechaFin < ahora) {
          return {
            color: 'text-red-500',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-800',
            icon: 'FaExclamationTriangle',
            label: 'Vencido',
            description: 'Certificado vencido por fecha'
          };
        }
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: 'FaCheckCircle',
          label: 'Vigente',
          description: 'Certificado vigente y válido'
        };
      
      case 'VENCIDO':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: 'FaExclamationTriangle',
          label: 'Vencido',
          description: 'Certificado vencido'
        };
        
      case 'CANCELADO':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: 'FaExclamationTriangle',
          label: 'Cancelado',
          description: 'Certificado cancelado'
        };
        
      default:
        return {
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          icon: 'FaInfoCircle',
          label: estado || 'Sin Estado',
          description: 'Estado del certificado'
        };
    }
  }

  /**
   * Generar URL de descarga del certificado
   * @param {string} idEncriptado - ID encriptado del certificado (ej: a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf)
   * @returns {string|null} URL de descarga o null si no hay archivo
   */
  getCertificateDownloadUrl(idEncriptado) {
    if (!idEncriptado) return null;
    return `https://aplicaciones.cmpc.org.ar/receta/certificados/tmp/${idEncriptado}`;
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
   * Calcular días restantes de un certificado
   * @param {Object} certificate - Objeto del certificado
   * @returns {number|null} Días restantes o null si no aplica
   */
  getDaysRemaining(certificate) {
    if (!certificate?.fecha_fin || certificate.estado?.toUpperCase() !== 'VIGENTE') return null;
    
    try {
      const fechaFin = new Date(certificate.fecha_fin);
      const ahora = new Date();
      const diffTime = fechaFin - ahora;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      console.warn('Error al calcular días restantes:', error);
      return null;
    }
  }

  /**
   * Verificar si un certificado está disponible para descarga
   * @param {Object} certificate - Objeto del certificado
   * @returns {boolean} True si está disponible para descarga
   */
  isDownloadAvailable(certificate) {
    return certificate?.id_encriptado != null;
  }

  /**
   * Obtener información del médico emisor
   * @param {Object} certificate - Objeto del certificado
   * @returns {string} Nombre completo del médico
   */
  getDoctorInfo(certificate) {
    if (!certificate) return 'No especificado';
    
    if (certificate.medico_emisor) {
      return `Dr. ${certificate.medico_emisor}`;
    }
    
    if (certificate.medico_nombre && certificate.medico_apellido) {
      return `Dr. ${certificate.medico_nombre} ${certificate.medico_apellido}`;
    }
    
    if (certificate.matricula_prescriptor) {
      return `MP: ${certificate.matricula_prescriptor}`;
    }
    
    return 'No especificado';
  }

  /**
   * Obtener el tipo de certificado formateado
   * @param {Object} certificate - Objeto del certificado
   * @returns {string} Tipo de certificado formateado
   */
  getCertificateTypeFormatted(certificate) {
    if (!certificate?.tipo_certificado) return 'Certificado Médico';
    
    const tipos = {
      'REPOSO': 'Certificado de Reposo',
      'APTITUD': 'Certificado de Aptitud',
      'DISCAPACIDAD': 'Certificado de Discapacidad',
      'SALUD': 'Certificado de Salud',
      'MEDICO': 'Certificado Médico'
    };
    
    return tipos[certificate.tipo_certificado.toUpperCase()] || certificate.tipo_certificado;
  }

  /**
   * Validar si un certificado es válido
   * @param {Object} certificate - Objeto del certificado
   * @returns {Object} Información de validación
   */
  validateCertificate(certificate) {
    if (!certificate) {
      return {
        isValid: false,
        issues: ['Certificado no válido']
      };
    }

    const issues = [];
    
    if (!certificate.tipo_certificado) {
      issues.push('Tipo de certificado no especificado');
    }
    
    if (!certificate.fecha_emision) {
      issues.push('Fecha de emisión no especificada');
    }
    
    if (!certificate.medico_emisor && !certificate.matricula_prescriptor) {
      issues.push('Médico emisor no especificado');
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
const certificatesService = new CertificatesService();
export default certificatesService;