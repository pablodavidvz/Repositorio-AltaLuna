import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCalendarAlt, FaSpinner, FaArrowLeft, FaUserMd,
  FaIdCard, FaExclamationTriangle, FaCheckCircle, FaClock, FaInfoCircle,
  FaHospital, FaFileAlt, FaSearch, FaEye, FaDownload, FaPrint, 
  FaQrcode, FaBed, FaMedkit, FaTimes
} from 'react-icons/fa';
import PatientContext from '../contexts/PatientContext';
import DniScanner from '../components/scanner/DniScanner';
import certificatesService from '../services/certificatesService';
import ErrorHandler from '../components/ui/ErrorHandler';

const CertificatesPage = () => {
  const { patient, setPatient } = useContext(PatientContext);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [searchDni, setSearchDni] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Si hay un paciente cargado, obtener sus certificados automáticamente
  useEffect(() => {
    if (patient?.dni) {
      fetchCertificatesByDni(patient.dni);
    }
  }, [patient]);

  // Función para obtener certificados por DNI
  const fetchCertificatesByDni = async (dni) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📜 Consultando certificados para DNI: ${dni}`);
      
      const result = await certificatesService.getCertificatesByDni(dni);
      
      if (result.success) {
        // Filtrar certificados que no sean null y tengan propiedades básicas
        const validCertificates = (result.certificates || []).filter(certificate => 
          certificate != null && 
          certificate.id != null
        );
        
        setCertificates(validCertificates);
        
        // Si no hay paciente cargado pero sí datos del paciente en la respuesta
        if (!patient && result.patient) {
          setPatient(result.patient);
        }
        
        console.log(`✅ Se encontraron ${validCertificates.length} certificados válidos`);
      } else {
        throw new Error(result.error || 'No se pudieron cargar los certificados');
      }
    } catch (error) {
      console.error('❌ Error al cargar certificados:', error);
      setError(error);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar escaneo de DNI
  const handleDniScanned = async (dni, dniScanData) => {
    setScannerActive(false);
    await fetchCertificatesByDni(dni);
  };

  // Buscar por DNI manual
  const handleManualSearch = (e) => {
    e.preventDefault();
    if (searchDni.trim() && /^\d{7,8}$/.test(searchDni.trim())) {
      fetchCertificatesByDni(searchDni.trim());
    } else {
      setError(new Error('Por favor ingresa un DNI válido (7-8 dígitos)'));
    }
  };

  // Función para obtener el icono del estado
  const getStatusIcon = (statusInfo) => {
    const iconMap = {
      'FaCheckCircle': <FaCheckCircle className={statusInfo.color} />,
      'FaClock': <FaClock className={statusInfo.color} />,
      'FaExclamationTriangle': <FaExclamationTriangle className={statusInfo.color} />,
      'FaInfoCircle': <FaInfoCircle className={statusInfo.color} />
    };
    
    return iconMap[statusInfo.icon] || <FaInfoCircle className={statusInfo.color} />;
  };

  // Función para obtener el icono del tipo de certificado
  const getCertificateTypeIcon = (type) => {
    const typeIcons = {
      'REPOSO': <FaBed className="text-blue-500" />,
      'APTITUD': <FaCheckCircle className="text-green-500" />,
      'DISCAPACIDAD': <FaMedkit className="text-purple-500" />,
      'SALUD': <FaCheckCircle className="text-emerald-500" />,
      'MEDICO': <FaFileAlt className="text-gray-500" />
    };
    
    return typeIcons[type?.toUpperCase()] || <FaFileAlt className="text-gray-500" />;
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/50 rounded-full text-primary-600 dark:text-primary-400 mb-6">
          <FaCalendarAlt className="text-3xl" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Mis Certificados Médicos
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Consulta tus certificados médicos digitales escaneando tu DNI
        </p>
      </motion.div>

      {/* Información del paciente actual */}
      {patient && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <FaIdCard className="text-xl text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {patient.nombre} {patient.apellido}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">DNI: {patient.dni}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Opciones de búsqueda */}
      {!patient && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FaSearch className="text-primary-500" />
            Buscar Certificados
          </h2>

          {/* Búsqueda manual por DNI */}
          <form onSubmit={handleManualSearch} className="mb-6">
            <label htmlFor="searchDni" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar por DNI
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="searchDni"
                value={searchDni}
                onChange={(e) => setSearchDni(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ej: 38437748"
                maxLength="8"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
                Buscar
              </button>
            </div>
          </form>

          {/* Opción de escanear DNI */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              onClick={() => setScannerActive(!scannerActive)}
              className="w-full py-3 border-2 border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <FaQrcode />
              {scannerActive ? 'Cerrar Escáner' : 'Escanear DNI'}
            </button>
          </div>

          {/* Escáner de DNI */}
          <AnimatePresence>
            {scannerActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 overflow-hidden"
              >
                <div className="border-2 border-blue-300 dark:border-blue-700 rounded-xl overflow-hidden">
                  <DniScanner onDniScanned={handleDniScanned} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Manejo de errores */}
      {error && (
        <div className="mb-6">
          <ErrorHandler 
            error={error} 
            onRetry={() => setError(null)}
            message="Hubo un problema al cargar los certificados médicos."
          />
        </div>
      )}

      {/* Estado de carga */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
        >
          <FaSpinner className="text-4xl text-primary-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando certificados médicos...</p>
        </motion.div>
      )}

      {/* Lista de certificados */}
      {!loading && certificates && certificates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Certificados Encontrados ({certificates.filter(c => c != null).length})
            </h2>
          </div>

          <div className="space-y-6">
            {certificates.filter(certificate => certificate != null).map((certificate, index) => {
              const statusInfo = certificatesService.getCertificateStatusInfo(certificate);
              const daysRemaining = certificatesService.getDaysRemaining(certificate);
              
              return (
                <motion.div
                  key={certificate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 ${statusInfo.borderColor} p-6 hover:shadow-md transition-shadow duration-200`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${statusInfo.bgColor} rounded-full flex items-center justify-center ${statusInfo.color}`}>
                        {getStatusIcon(statusInfo)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {getCertificateTypeIcon(certificate.tipo_certificado)}
                          {certificatesService.getCertificateTypeFormatted(certificate)}
                        </h3>
                        <p className={`text-sm ${statusInfo.color} font-medium flex items-center gap-2`}>
                          {statusInfo.label}
                          {daysRemaining !== null && daysRemaining > 0 && statusInfo.label === 'Vigente' && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                              {daysRemaining} días restantes
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCertificate(certificate)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2"
                    >
                      <FaEye />
                      Ver Detalles
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Médico Emisor</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <FaUserMd className="text-xs" />
                        {certificatesService.getDoctorInfo(certificate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Emisión</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <FaCalendarAlt className="text-xs" />
                        {certificatesService.formatDateOnly(certificate.fecha_emision)}
                      </p>
                    </div>
                    {certificate.fecha_inicio && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Inicio</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                          <FaCalendarAlt className="text-xs text-green-500" />
                          {certificatesService.formatDateOnly(certificate.fecha_inicio)}
                        </p>
                      </div>
                    )}
                  </div>

                  {certificate.fecha_fin && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Finalización</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <FaCalendarAlt className="text-xs text-red-500" />
                        {certificatesService.formatDateOnly(certificate.fecha_fin)}
                      </p>
                    </div>
                  )}

                  {certificate.dias_reposo && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Días de Reposo</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <FaBed className="text-xs text-blue-500" />
                        {certificate.dias_reposo} días
                      </p>
                    </div>
                  )}

                  {certificate.original_data?.diagnostico && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Diagnóstico</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {certificate.original_data.diagnostico}
                      </p>
                    </div>
                  )}

                  {certificate.observaciones && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Observaciones</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {certificate.observaciones}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    {certificate.matricula_prescriptor && (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                          MP {certificate.matricula_prescriptor}
                        </span>
                      </div>
                    )}
                    {certificate.device && (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                          {certificate.device}
                        </span>
                      </div>
                    )}
                    {certificate.centro_medico && (
                      <div className="flex items-center gap-2">
                        <FaHospital />
                        <span>{certificate.centro_medico}</span>
                      </div>
                    )}
                  </div>

                  {/* Botón de descarga */}
                  {certificatesService.isDownloadAvailable(certificate) && (
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <a
                        href={certificatesService.getCertificateDownloadUrl(certificate.id_encriptado)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
                      >
                        <FaDownload />
                        Descargar
                      </a>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Estado vacío */}
      {!loading && certificates.length === 0 && !error && (patient || searchDni) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
        >
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCalendarAlt className="text-3xl text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No se encontraron certificados
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No hay certificados médicos registrados para este DNI.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
          >
            <FaArrowLeft />
            Volver al Inicio
          </button>
        </motion.div>
      )}

      {/* Modal de detalles del certificado */}
      <AnimatePresence>
        {selectedCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedCertificate(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Detalle del Certificado
                  </h2>
                  <button
                    onClick={() => setSelectedCertificate(null)}
                    className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Información básica */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tipo de Certificado</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {getCertificateTypeIcon(selectedCertificate.tipo_certificado)}
                        {certificatesService.getCertificateTypeFormatted(selectedCertificate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estado</p>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(certificatesService.getCertificateStatusInfo(selectedCertificate))}
                        <span className={`font-semibold ${certificatesService.getCertificateStatusInfo(selectedCertificate).color}`}>
                          {certificatesService.getCertificateStatusInfo(selectedCertificate).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fecha de Emisión</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <FaCalendarAlt className="text-primary-500" />
                        {certificatesService.formatDate(selectedCertificate.fecha_emision)}
                      </p>
                    </div>
                    {selectedCertificate.fecha_inicio && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fecha de Inicio</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <FaCalendarAlt className="text-green-500" />
                          {certificatesService.formatDate(selectedCertificate.fecha_inicio)}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedCertificate.fecha_fin && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fecha de Finalización</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <FaCalendarAlt className="text-red-500" />
                          {certificatesService.formatDate(selectedCertificate.fecha_fin)}
                        </p>
                      </div>
                      {selectedCertificate.dias_reposo && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Días de Reposo</p>
                          <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <FaBed className="text-blue-500" />
                            {selectedCertificate.dias_reposo} días
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Diagnóstico */}
                  {selectedCertificate.original_data?.diagnostico && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Diagnóstico</p>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-900 dark:text-white">
                          {selectedCertificate.original_data.diagnostico}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Observaciones */}
                  {selectedCertificate.observaciones && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Observaciones</p>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-900 dark:text-white">
                          {selectedCertificate.observaciones}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Información del médico */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <FaUserMd className="text-primary-500" />
                      Información del Médico Emisor
                    </h3>
                    
                    {selectedCertificate.medico_emisor && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="font-semibold text-blue-800 dark:text-blue-300 text-lg">
                          {certificatesService.getDoctorInfo(selectedCertificate)}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCertificate.matricula_prescriptor && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Matrícula Profesional</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            MP {selectedCertificate.matricula_prescriptor}
                          </p>
                        </div>
                      )}
                      {selectedCertificate.matricula_especialidad && selectedCertificate.matricula_especialidad !== 99999 && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Matrícula Especialidad</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            ME {selectedCertificate.matricula_especialidad}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Información técnica */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCertificate.device && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Dispositivo</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedCertificate.device}
                          </p>
                        </div>
                      )}
                      {selectedCertificate.centro_medico && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Centro Médico</p>
                          <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <FaHospital className="text-primary-500" />
                            {selectedCertificate.centro_medico}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-wrap gap-3">
                    {certificatesService.isDownloadAvailable(selectedCertificate) && (
                      <a
                        href={certificatesService.getCertificateDownloadUrl(selectedCertificate.id_encriptado)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <FaDownload />
                        Descargar
                      </a>
                    )}
                    <button
                      onClick={() => window.print()}
                      className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <FaPrint />
                      Imprimir
                    </button>
                    <button
                      onClick={() => setSelectedCertificate(null)}
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CertificatesPage;