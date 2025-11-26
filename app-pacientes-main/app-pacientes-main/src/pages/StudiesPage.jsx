import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaClipboardList, FaSpinner, FaArrowLeft, FaCalendarAlt, FaUserMd,
  FaIdCard, FaExclamationTriangle, FaCheckCircle, FaClock, FaInfoCircle,
  FaHospital, FaStethoscope, FaSearch, FaEye, FaDownload, FaPrint, 
  FaQrcode, FaFileAlt, FaFlask
} from 'react-icons/fa';
import PatientContext from '../contexts/PatientContext';
import DniScanner from '../components/scanner/DniScanner';
import studiesService from '../services/studiesService';
import ErrorHandler from '../components/ui/ErrorHandler';

const StudiesPage = () => {
  const { patient, setPatient } = useContext(PatientContext);
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [searchDni, setSearchDni] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Si hay un paciente cargado, obtener sus estudios automáticamente
  useEffect(() => {
    if (patient?.dni) {
      fetchStudiesByDni(patient.dni);
    }
  }, [patient]);

  // Función para obtener estudios por DNI
  const fetchStudiesByDni = async (dni) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📊 Consultando estudios para DNI: ${dni}`);
      
      const result = await studiesService.getStudiesByDni(dni);
      
      if (result.success) {
        // Filtrar estudios que no sean null y tengan propiedades básicas
        const validStudies = (result.studies || []).filter(study => 
          study != null && 
          study.id != null
        );
        
        setStudies(validStudies);
        
        // Si no hay paciente cargado pero sí datos del paciente en la respuesta
        if (!patient && result.patient) {
          setPatient(result.patient);
        }
        
        console.log(`✅ Se encontraron ${validStudies.length} estudios válidos`);
      } else {
        throw new Error(result.error || 'No se pudieron cargar los estudios');
      }
    } catch (error) {
      console.error('❌ Error al cargar estudios:', error);
      setError(error);
      setStudies([]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar escaneo de DNI
  const handleDniScanned = async (dni, dniScanData) => {
    setScannerActive(false);
    await fetchStudiesByDni(dni);
  };

  // Buscar por DNI manual
  const handleManualSearch = (e) => {
    e.preventDefault();
    if (searchDni.trim() && /^\d{7,8}$/.test(searchDni.trim())) {
      fetchStudiesByDni(searchDni.trim());
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
          <FaClipboardList className="text-3xl" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Mis Estudios Médicos
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Consulta tus estudios médicos digitales escaneando tu DNI
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
            Buscar Estudios
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
            message="Hubo un problema al cargar los estudios médicos."
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
          <p className="text-gray-600 dark:text-gray-400">Cargando estudios médicos...</p>
        </motion.div>
      )}

      {/* Lista de estudios */}
      {!loading && studies && studies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Estudios Encontrados ({studies.filter(s => s != null).length})
            </h2>
          </div>

          <div className="space-y-6">
            {studies.filter(study => study != null).map((study, index) => {
              const statusInfo = studiesService.getStudyStatusInfo(study);
              
              return (
                <motion.div
                  key={study.id}
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
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {study.tipo_estudio || 'Estudio Médico'}
                        </h3>
                        <p className={`text-sm ${statusInfo.color} font-medium`}>
                          {statusInfo.label}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStudy(study)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2"
                    >
                      <FaEye />
                      Ver Detalles
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Tipo de Estudio</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <FaFlask className="text-xs" />
                        {study.tipo_estudio || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Médico Solicitante</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <FaUserMd className="text-xs" />
                        {studiesService.getDoctorInfo(study)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Solicitud</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <FaCalendarAlt className="text-xs" />
                        {studiesService.formatDateOnly(study.fecha_solicitud)}
                      </p>
                    </div>
                  </div>

                  {study.fecha_resultado && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Resultado</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <FaCalendarAlt className="text-xs text-green-500" />
                        {studiesService.formatDateOnly(study.fecha_resultado)}
                      </p>
                    </div>
                  )}

                  {study.original_data?.diagnostico && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Diagnóstico</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {study.original_data.diagnostico}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    {study.matricula_prescriptor && (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                          MP {study.matricula_prescriptor}
                        </span>
                      </div>
                    )}
                    {study.device && (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                          {study.device}
                        </span>
                      </div>
                    )}
                    {study.centro_medico && (
                      <div className="flex items-center gap-2">
                        <FaHospital />
                        <span>{study.centro_medico}</span>
                      </div>
                    )}
                  </div>

                  {/* Botón de descarga si hay resultado */}
                  {studiesService.hasResultAvailable(study) && study.id_encriptado && (
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <a
                        href={studiesService.getStudyDownloadUrl(study.id_encriptado)}
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
      {!loading && studies.length === 0 && !error && (patient || searchDni) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
        >
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaClipboardList className="text-3xl text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No se encontraron estudios
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No hay estudios médicos registrados para este DNI.
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

      {/* Modal de detalles del estudio */}
      <AnimatePresence>
        {selectedStudy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedStudy(null)}
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
                    Detalle del Estudio
                  </h2>
                  <button
                    onClick={() => setSelectedStudy(null)}
                    className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Información básica */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tipo de Estudio</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <FaFlask className="text-primary-500" />
                        {selectedStudy.tipo_estudio || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estado</p>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(studiesService.getStudyStatusInfo(selectedStudy))}
                        <span className={`font-semibold ${studiesService.getStudyStatusInfo(selectedStudy).color}`}>
                          {studiesService.getStudyStatusInfo(selectedStudy).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fecha de Solicitud</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <FaCalendarAlt className="text-primary-500" />
                        {studiesService.formatDate(selectedStudy.fecha_solicitud)}
                      </p>
                    </div>
                    {selectedStudy.fecha_resultado && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fecha de Resultado</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <FaCalendarAlt className="text-green-500" />
                          {studiesService.formatDate(selectedStudy.fecha_resultado)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Diagnóstico */}
                  {selectedStudy.original_data?.diagnostico && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Diagnóstico</p>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-900 dark:text-white">
                          {selectedStudy.original_data.diagnostico}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Observaciones */}
                  {selectedStudy.observaciones && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Observaciones</p>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-900 dark:text-white">
                          {selectedStudy.observaciones}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Información del médico */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <FaUserMd className="text-primary-500" />
                      Información del Médico Solicitante
                    </h3>
                    
                    {selectedStudy.medico_solicitante && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="font-semibold text-blue-800 dark:text-blue-300 text-lg">
                          {studiesService.getDoctorInfo(selectedStudy)}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedStudy.matricula_prescriptor && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Matrícula Profesional</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            MP {selectedStudy.matricula_prescriptor}
                          </p>
                        </div>
                      )}
                      {selectedStudy.matricula_especialidad && selectedStudy.matricula_especialidad !== 99999 && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Matrícula Especialidad</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            ME {selectedStudy.matricula_especialidad}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Información técnica */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedStudy.device && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Dispositivo</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedStudy.device}
                          </p>
                        </div>
                      )}
                      {selectedStudy.centro_medico && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Centro Médico</p>
                          <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <FaHospital className="text-primary-500" />
                            {selectedStudy.centro_medico}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-wrap gap-3">
                    {studiesService.hasResultAvailable(selectedStudy) && selectedStudy.id_encriptado && (
                      <a
                        href={studiesService.getStudyDownloadUrl(selectedStudy.id_encriptado)}
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
                      onClick={() => setSelectedStudy(null)}
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

export default StudiesPage;