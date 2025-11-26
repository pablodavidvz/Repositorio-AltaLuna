// utils/dateFormatter.js

/**
 * Convierte fecha del DNI (DD/MM/YYYY) a formato ISO (YYYY-MM-DD)
 * @param {string} dateString - Fecha en formato DD/MM/YYYY
 * @returns {string|null} - Fecha en formato ISO o null si no es válida
 */
const formatDateToISO = (dateString) => {
    if (!dateString || dateString === 'No disponible' || typeof dateString !== 'string') {
        return null;
    }
    
    const parts = dateString.split('/');
    if (parts.length !== 3) {
        return null;
    }
    
    const [day, month, year] = parts;
    
    // Validar que sean números válidos
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return null;
    }
    
    // Validar rangos
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
        return null;
    }
    
    // Formatear con ceros a la izquierda
    const formattedDay = day.padStart(2, '0');
    const formattedMonth = month.padStart(2, '0');
    
    return `${year}-${formattedMonth}-${formattedDay}`;
};

/**
 * Convierte fecha ISO (YYYY-MM-DD) a formato de DNI (DD/MM/YYYY)
 * @param {string} isoDate - Fecha en formato ISO
 * @returns {string|null} - Fecha en formato DD/MM/YYYY o null si no es válida
 */
const formatISOToDate = (isoDate) => {
    if (!isoDate) return null;
    
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return null;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
};

/**
 * Valida si una fecha está en formato correcto
 * @param {string} dateString - Fecha a validar
 * @param {string} format - Formato esperado ('ISO' o 'DNI')
 * @returns {boolean} - True si es válida
 */
const isValidDate = (dateString, format = 'ISO') => {
    if (!dateString) return false;
    
    if (format === 'ISO') {
        const date = new Date(dateString);
        return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
    } else if (format === 'DNI') {
        return dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) !== null;
    }
    
    return false;
};

module.exports = {
    formatDateToISO,
    formatISOToDate,
    isValidDate
};