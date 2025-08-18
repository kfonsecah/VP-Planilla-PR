import { useState } from 'react';
import { EmployeeFormData } from '@/types';

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
    employee_schedule: 'Horario Diurno'
  });

  /**
   * Maneja los cambios en los inputs del formulario
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      employee_schedule: 'Horario Diurno'
    });
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = (onSubmit: (data: EmployeeFormData) => void, onClose: () => void) => {
    return (e: React.FormEvent) => {
      e.preventDefault();
      
      // TODO: Agregar validaciones del formulario aquí
      if (!validateForm()) {
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
   * TODO: Implementar validaciones completas
   */
  const validateForm = (): boolean => {
    // Validaciones básicas
    if (!formData.employee_first_name.trim()) return false;
    if (!formData.employee_last_name.trim()) return false;
    if (!formData.employee_national_id.trim()) return false;
    if (!formData.employee_email.trim()) return false;
    if (!formData.employee_position_id) return false;
    
    return true;
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
