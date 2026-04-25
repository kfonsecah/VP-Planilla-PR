import { useState } from 'react';
import { EmployeeFormData } from '@/types'
import { formatNationalId, formatSocialCode, formatPhone, normalizeDateInput } from '@/utils/formatters';

/**
 * Hook para manejar la lógica del modal de agregar empleado
 */
const useAddEmployeeModal = () => {
  const [formData, setFormData] = useState<EmployeeFormData>({
    employee_first_name: '',
    employee_middle_name: '',
    employee_last_name: '',
    employee_national_id: '',
    employee_social_code: '',
    employee_email: '',
    employee_phone: '',
    employee_position_id: '',
    employee_hire_date: '',
    employee_gender: 'Masculino',
    employee_required_hours_biweekly: ''
  });

  /**
   * Maneja los cambios en los inputs del formulario
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;

    let newValue = value;

    // Autoformateo por campo
    if (name === 'employee_national_id') {
      newValue = formatNationalId(value);
    } else if (name === 'employee_social_code') {
      newValue = formatSocialCode(value);
    } else if (name === 'employee_phone') {
      newValue = formatPhone(value);
    } else if (name === 'employee_hire_date') {
      // Normalize many user inputs to YYYY-MM-DD
      newValue = normalizeDateInput(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  /**
   * Reinicia el formulario a sus valores iniciales
   */
  const resetForm = () => {
    setFormData({
      employee_first_name: '',
      employee_middle_name: '',
      employee_last_name: '',
      employee_national_id: '',
      employee_social_code: '',
      employee_email: '',
      employee_phone: '',
      employee_position_id: '',
      employee_hire_date: '',
      employee_gender: 'Masculino',
      employee_required_hours_biweekly: ''
    });
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = (onSubmit: (data: EmployeeFormData) => void, onClose: () => void) => {
    return (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validaciones del formulario
      if (!validateForm()) {
        // No mostrar mensajes intrusivos; simplemente impedir envío
        return;
      }
      
      onSubmit(formData);
      resetForm();
      onClose();
    };
  };

  /**
   * Maneja la cancelación del formulario
   */
  const handleCancel = (onClose: () => void) => {
    return () => {
      resetForm();
      onClose();
    };
  };

  /**
   * Valida los datos del formulario
   */
  const validateForm = (): boolean => {
    // Validaciones básicas
    if (!formData.employee_first_name.trim()) return false;
    if (!formData.employee_last_name.trim()) return false;
    if (!formData.employee_email.trim()) return false;
    if (!formData.employee_position_id) return false;

    // Formato cédula: X-XXXX-XXXX (1-1234-1234)
    const cedulaRegex = /^\d-\d{4}-\d{4}$/;
    if (!cedulaRegex.test(formData.employee_national_id)) return false;

    // Código CCSS: 12 dígitos
    const socialRegex = /^\d{12}$/;
    if (formData.employee_social_code && !socialRegex.test(formData.employee_social_code)) return false;

    // Teléfono: 1234-1234
    const phoneRegex = /^\d{4}-\d{4}$/;
    if (formData.employee_phone && !phoneRegex.test(formData.employee_phone)) return false;

    // Fecha: YYYY-MM-DD (permitir vacío)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return !(formData.employee_hire_date && !dateRegex.test(formData.employee_hire_date));
  };

  return {
    formData,
    handleInputChange,
    handleSubmit,
    handleCancel,
    resetForm,
    validateForm
  };
};

export default useAddEmployeeModal;
