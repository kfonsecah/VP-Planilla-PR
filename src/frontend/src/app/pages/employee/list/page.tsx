'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import EmployeeStatsCards from '@/components/EmployeeStatsCards';
import EmployeeTable from '@/components/EmployeeTable';

interface Employee {
  id: string;
  name: string;
  position: string;
  salary: number;
  status: 'active' | 'vacation' | 'incomplete_assistance' | 'incapacity_maternity';
}

interface EmployeeStats {
  total: number;
  onVacation: number;
  incompleteAssistance: number;
  incapacityMaternity: number;
}

const EmployeeListPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<EmployeeStats>({
    total: 0,
    onVacation: 0,
    incompleteAssistance: 0,
    incapacityMaternity: 0
  });

  // Sample data - replace with actual API call
  useEffect(() => {
    const sampleEmployees: Employee[] = [
      { id: '1', name: 'María Solano Rojas', position: 'Encargado(a) de caja', salary: 360000, status: 'active' },
      { id: '2', name: 'José Andrés Chavarría Soto', position: 'Cocinero(a) principal', salary: 450000, status: 'incomplete_assistance' },
      { id: '3', name: 'Gabriela Solano Méndez', position: 'Salonero(a)', salary: 320000, status: 'vacation' },
      { id: '4', name: 'Kevin Vargas Umaña', position: 'Barista', salary: 320000, status: 'active' },
      { id: '5', name: 'Maritza Días Hidalgo', position: 'Barista', salary: 320000, status: 'active' },
      { id: '6', name: 'Esteban Soto Solís', position: 'Barista', salary: 320000, status: 'active' },
      { id: '7', name: 'Karen Vargas Solorzano', position: 'Salonero(a)', salary: 320000, status: 'incomplete_assistance' },
      { id: '8', name: 'Miguel Díaz Díaz', position: 'Salonero(a)', salary: 320000, status: 'active' },
      { id: '9', name: 'Mathew Ureña Jiménez', position: 'Cocinero(a)', salary: 320000, status: 'active' },
      { id: '10', name: 'Laura Chinchilla Chavez', position: 'Cocinero(a)', salary: 320000, status: 'active' },
      { id: '11', name: 'Oscar Arias Solís', position: 'Ayudante de cocina', salary: 320000, status: 'active' },
      { id: '12', name: 'Carlos León Jiménez', position: 'Barista', salary: 320000, status: 'active' },
      { id: '13', name: 'Douglas Calvo Campos', position: 'Salonero(a)', salary: 320000, status: 'vacation' }
    ];

    setEmployees(sampleEmployees);
    setFilteredEmployees(sampleEmployees);

    // Calculate stats
    const newStats = {
      total: sampleEmployees.length,
      onVacation: sampleEmployees.filter(emp => emp.status === 'vacation').length,
      incompleteAssistance: sampleEmployees.filter(emp => emp.status === 'incomplete_assistance').length,
      incapacityMaternity: sampleEmployees.filter(emp => emp.status === 'incapacity_maternity').length
    };
    setStats(newStats);
  }, []);

  // Filter employees based on search term
  useEffect(() => {
    const filtered = employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  const handleEmployeeAction = (action: string, employeeId: string) => {
    console.log(`Action: ${action} for employee: ${employeeId}`);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <div className="min-h-screen p-6 bg-[#E7DCC1]">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-light text-[#3B4D36]">Lista de empleados</h1>
          <button className="flex items-center gap-2 px-4 py-2 text-[#3B4D36] transition-colors bg-[#A7AA94] rounded-lg hover:bg-[#6F7153]/80">
            <PlusIcon className="w-5 h-5" />
            Añadir Nuevo Empleado
          </button>
        </div>

        {/* Statistics Cards */}
        <EmployeeStatsCards stats={stats} />

        {/* Main Content - Employee Table */}
        <EmployeeTable 
          employees={filteredEmployees}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onEmployeeAction={handleEmployeeAction}
        />
      </div>
    </div>
  );
};

export default EmployeeListPage;