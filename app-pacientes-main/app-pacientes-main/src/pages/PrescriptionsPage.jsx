import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaFileMedical, FaSpinner, FaArrowLeft, FaCalendarAlt, FaUserMd,
  FaIdCard, FaExclamationTriangle, FaCheckCircle, FaClock, FaInfoCircle,
  FaPrescriptionBottle, FaHospital, FaStethoscope, FaSearch, FaEye,
  FaDownload, FaPrint, FaQrcode
} from 'react-icons/fa';
import PatientContext from '../contexts/PatientContext';
import DniScanner from '../components/scanner/DniScanner';
import patientService from '../services/patientService';
import ErrorHandler from '../components/ui/ErrorHandler';

const PrescriptionsPage = () => {
  const { patient, setPatient } = useContext(PatientContext);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [searchDni, setSearchDni] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Si hay un paciente cargado, obtener sus recetas automáticamente
  useEffect(() => {
    if (patient?.dni) {
      fetchPrescriptionsByDni(patient.dni);
    }
  }, [patient]);

  // Función para obtener recetas por DNI
  const fetchPrescriptionsByDni = async (dni) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📋 Consultando recetas para DNI: ${dni}`);
      
      // Usar el endpoint principal de la API
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000/app-pacientes-server'}/api/prescriptions/dni/${dni}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No se encontraron recetas para este DNI');
        }
        throw new Error('Error al consultar las recetas');
      }

      const data = await response.json();
      
      if (data.success) {
        // Filtrar prescriptions que no sean null y tengan propiedades básicas
        const validPrescriptions = (data.prescriptions || []).filter(prescription => 
          prescription != null && 
          prescription.idreceta != null
        );
        
        setPrescriptions(validPrescriptions);
        
        // Si no hay paciente cargado pero sí datos del paciente en la respuesta
        if (!patient && data.patient) {
          setPatient(data.patient);
        }
        
        console.log(`✅ Se encontraron ${validPrescriptions.length} recetas válidas`);
      } else {
        throw new Error('No se pudieron cargar las recetas');
      }
    } catch (error) {
      console.error('❌ Error al cargar recetas:', error);
      setError(error);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar escaneo de DNI
  const handleDniScanned = async (dni, dniScanData) => {
    setScannerActive(false);
    await fetchPrescriptionsByDni(dni);
  };

  // Buscar por DNI manual
  const handleManualSearch = (e) => {
    e.preventDefault();
    if (searchDni.trim() && /^\d{7,8}$/.test(searchDni.trim())) {
      fetchPrescriptionsByDni(searchDni.trim());
    } else {
      setError(new Error('Por favor ingresa un DNI válido (7-8 dígitos)'));
    }
  };

  // Función para determinar el estado visual de una receta
  const getPrescriptionStatusInfo = (prescription) => {
    // Verificación de seguridad
    if (!prescription) {
      return {
        color: 'text-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-800',
        icon: <FaInfoCircle />,
        label: 'Desconocido',
        description: 'Estado de la receta no disponible'
      };
    }

    const estado = prescription.estado?.toUpperCase();
    const bloqueo = prescription.bloqueo;
    const anulacionmotivo = prescription.anulacionmotivo;
    
    // Si hay motivo de anulación, está anulada
    if (anulacionmotivo) {
      return {
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: <FaExclamationTriangle />,
        label: 'Anulada',
        description: 'Esta receta ha sido anulada'
      };
    }
    
    // Si hay bloqueo, está bloqueada
    if (bloqueo) {
      return {
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        icon: <FaClock />,
        label: 'Bloqueada',
        description: 'Esta receta está bloqueada'
      };
    }
    
    // Si no tiene estado específico o es null, asumimos que está activa
    if (!estado || estado === 'NULL') {
      return {
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: <FaCheckCircle />,
        label: 'Activa',
        description: 'Receta válida y disponible'
      };
    }
    
    return {
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      icon: <FaInfoCircle />,
      label: estado || 'Activa',
      description: 'Estado de la receta'
    };
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'No especificada';
    }
  };

  // Generar URL de descarga de la receta
  const getRecipeDownloadUrl = (numRecetaOfuscada) => {
    if (!numRecetaOfuscada) return null;
    return `https://receta.s3.us-east-1.amazonaws.com/tmp/${numRecetaOfuscada}`;
  };

  // Obtener información del medicamento
  const getMedicamentoInfo = (prescription) => {
    // Verificación de seguridad
    if (!prescription || !prescription.medicamentos || prescription.medicamentos.length === 0) {
      return 'Sin medicamentos especificados';
    }

    // Si hay múltiples medicamentos, mostrar el primero + contador
    if (prescription.medicamentos.length === 1) {
      const med = prescription.medicamentos[0];
      return med.nombre_comercial || med.medicamento_completo || 'Medicamento sin especificar';
    } else {
      const primerMed = prescription.medicamentos[0];
      const nombre = primerMed.nombre_comercial || primerMed.medicamento_completo || 'Medicamento';
      return `${nombre} (+${prescription.medicamentos.length - 1} más)`;
    }
  };

  // Obtener detalles del medicamento para el modal
  const getMedicamentoDetalles = (prescription) => {
    // Verificación de seguridad: asegurarse de que prescription existe
    if (!prescription || !prescription.medicamentos || prescription.medicamentos.length === 0) {
      return null;
    }
    
    return prescription.medicamentos.map(med => ({
      nombre: med.nombre_comercial || 'Medicamento sin nombre comercial',
      monodroga: med.monodroga,
      presentacion: med.presentacion,
      laboratorio: med.laboratorio,
      codigo: med.codigo,
      medicamento_completo: med.medicamento_completo,
      nro_orden: med.nro_orden
    }));
  };

  // Función para mostrar información completa del medicamento
  const getMedicamentoDisplayName = (medicamento) => {
    // Verificación de seguridad
    if (!medicamento) {
      return 'Medicamento sin información';
    }

    if (medicamento.nombre_comercial && medicamento.monodroga) {
      return `${medicamento.nombre_comercial} (${medicamento.monodroga})`;
    }
    if (medicamento.nombre_comercial) {
      return medicamento.nombre_comercial;
    }
    if (medicamento.medicamento_completo && medicamento.medicamento_completo !== 'Código: 0') {
      return medicamento.medicamento_completo;
    }
    return `Medicamento #${medicamento.nro_orden || 1}`;
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
          <FaFileMedical className="text-3xl" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Mis Recetas Médicas
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Consulta tus recetas médicas digitales escaneando tu DNI
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
            Buscar Recetas
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
            message="Hubo un problema al cargar las recetas."
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
          <p className="text-gray-600 dark:text-gray-400">Cargando recetas médicas...</p>
        </motion.div>
      )}

      {/* Lista de recetas */}
      {!loading && prescriptions && prescriptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Recetas Encontradas ({prescriptions.filter(p => p != null).length})
            </h2>
          </div>

          <div className="space-y-6">
            {prescriptions.filter(prescription => prescription != null).map((prescription, index) => {
              const statusInfo = getPrescriptionStatusInfo(prescription);
              
              return (
                <motion.div
                  key={prescription.idreceta}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 ${statusInfo.borderColor} p-6 hover:shadow-md transition-shadow duration-200`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${statusInfo.bgColor} rounded-full flex items-center justify-center ${statusInfo.color}`}>
                        {statusInfo.icon}
                      </div>

                  {/* Medicamentos prescritos */}
                  {selectedPrescription && getMedicamentoDetalles(selectedPrescription) && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Medicamentos Prescritos</p>
                      <div className="space-y-3">
                        {getMedicamentoDetalles(selectedPrescription).map((medicamento, index) => (
                          <div key={index} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                                <FaPrescriptionBottle className="text-sm" />
                                {getMedicamentoDisplayName(medicamento)}
                              </h4>
                              <span className="text-xs bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                #{medicamento.nro_orden || index + 1}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              {medicamento.monodroga && (
                                <div>
                                  <p className="text-green-600 dark:text-green-400 font-medium">Principio Activo:</p>
                                  <p className="text-green-700 dark:text-green-300">{medicamento.monodroga}</p>
                                </div>
                              )}
                              
                              {medicamento.presentacion && (
                                <div>
                                  <p className="text-green-600 dark:text-green-400 font-medium">Presentación:</p>
                                  <p className="text-green-700 dark:text-green-300">{medicamento.presentacion}</p>
                                </div>
                              )}
                              
                              {medicamento.laboratorio && (
                                <div>
                                  <p className="text-green-600 dark:text-green-400 font-medium">Laboratorio:</p>
                                  <p className="text-green-700 dark:text-green-300">{medicamento.laboratorio}</p>
                                </div>
                              )}
                              
                              {medicamento.codigo && medicamento.codigo !== 0 && (
                                <div>
                                  <p className="text-green-600 dark:text-green-400 font-medium">Código:</p>
                                  <p className="text-green-700 dark:text-green-300 font-mono">{medicamento.codigo}</p>
                                </div>
                              )}
                            </div>

                            {/* Información completa como fallback */}
                            {medicamento.medicamento_completo && 
                             medicamento.medicamento_completo !== 'Código: 0' && 
                             !medicamento.nombre_comercial && (
                              <div className="mt-3 p-2 bg-green-100 dark:bg-green-800/30 rounded text-sm">
                                <p className="text-green-700 dark:text-green-300">
                                  <strong>Descripción:</strong> {medicamento.medicamento_completo}
                                </p>
                              </div>
                            )}

                            {/* Advertencia para medicamentos sin información */}
                            {medicamento.medicamento_completo === 'Código: 0' && (
                              <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-sm">
                                <p className="text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                                  <FaInfoCircle />
                                  Medicamento sin información detallada disponible
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Si no hay medicamentos */}
                  {selectedPrescription && (!getMedicamentoDetalles(selectedPrescription) || !selectedPrescription.medicamentos || selectedPrescription.medicamentos.length === 0) && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Medicamentos</p>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <FaInfoCircle />
                          No hay medicamentos especificados en esta receta
                        </p>
                      </div>
                    </div>
                  )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Receta #{prescription.idreceta}
                        </h3>
                        <p className={`text-sm ${statusInfo.color} font-medium`}>
                          {statusInfo.label}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPrescription(prescription)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2"
                    >
                      <FaEye />
                      Ver Detalles
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Medicamento(s)</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getMedicamentoInfo(prescription)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Prescriptor</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <FaUserMd className="text-xs" />
                        {prescription.medico_nombre_completo ? 
                          `Dr. ${prescription.medico_nombre_completo}` : 
                          `MP: ${prescription.matricprescr || 'No especificada'}`
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Emisión</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <FaCalendarAlt className="text-xs" />
                        {formatDate(prescription.fechaemision)}
                      </p>
                    </div>
                  </div>

                  {prescription.diagnostico && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Diagnóstico</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {prescription.diagnostico}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    {prescription.matricprescr && (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                          MP {prescription.matricprescr}
                        </span>
                      </div>
                    )}
                    {prescription.device && (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                          {prescription.device}
                        </span>
                      </div>
                    )}
                    {prescription.empresa && (
                      <div className="flex items-center gap-2">
                        <FaHospital />
                        <span>{prescription.empresa}</span>
                      </div>
                    )}
                  </div>

                  {/* Botón de descarga de receta */}
                  {getRecipeDownloadUrl(prescription.num_receta_ofuscada) && (
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <a
                        href={getRecipeDownloadUrl(prescription.num_receta_ofuscada)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
                      >
                        <FaDownload />
                        Descargar Receta PDF
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
      {!loading && prescriptions.length === 0 && !error && (patient || searchDni) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
        >
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaPrescriptionBottle className="text-3xl text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No se encontraron recetas
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No hay recetas médicas registradas para este DNI.
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

      {/* Modal de detalles de receta */}
      <AnimatePresence>
        {selectedPrescription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPrescription(null)}
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
                    Detalle de Receta
                  </h2>
                  <button
                    onClick={() => setSelectedPrescription(null)}
                    className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Información básica */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fecha de Emisión</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <FaCalendarAlt className="text-primary-500" />
                        {formatDate(selectedPrescription.fechaemision)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estado</p>
                      <div className="flex items-center gap-2">
                        {getPrescriptionStatusInfo(selectedPrescription).icon}
                        <span className={`font-semibold ${getPrescriptionStatusInfo(selectedPrescription).color}`}>
                          {getPrescriptionStatusInfo(selectedPrescription).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ID Receta</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        #{selectedPrescription.idreceta}
                      </p>
                    </div>
                  </div>

                  {/* Diagnóstico */}
                  {selectedPrescription.diagnostico && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Diagnóstico</p>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-900 dark:text-white">
                          {selectedPrescription.diagnostico}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Diagnóstico secundario */}
                  {selectedPrescription.diagnostico2 && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Diagnóstico Secundario</p>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-900 dark:text-white">
                          {selectedPrescription.diagnostico2}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Información del médico */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <FaUserMd className="text-primary-500" />
                      Información del Prescriptor
                    </h3>
                    
                    {/* Nombre del médico */}
                    {selectedPrescription.medico_nombre_completo && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="font-semibold text-blue-800 dark:text-blue-300 text-lg">
                          Dr. {selectedPrescription.medico_nombre_completo}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedPrescription.matricprescr && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Matrícula Profesional</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            MP {selectedPrescription.matricprescr}
                          </p>
                        </div>
                      )}
                      {selectedPrescription.matricespec_prescr && selectedPrescription.matricespec_prescr !== 99999 && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Matrícula Especialidad</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            ME {selectedPrescription.matricespec_prescr}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Información técnica */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedPrescription.device && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Dispositivo</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedPrescription.device}
                          </p>
                        </div>
                      )}
                      {selectedPrescription.empresa && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Empresa</p>
                          <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <FaHospital className="text-primary-500" />
                            {selectedPrescription.empresa}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-wrap gap-3">
                    {getRecipeDownloadUrl(selectedPrescription.num_receta_ofuscada) && (
                      <a
                        href={getRecipeDownloadUrl(selectedPrescription.num_receta_ofuscada)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <FaDownload />
                        Descargar PDF
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
                      onClick={() => setSelectedPrescription(null)}
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

export default PrescriptionsPage;