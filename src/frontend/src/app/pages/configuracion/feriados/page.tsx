'use client';

import { useState, useEffect } from 'react';
import { holidaysService } from '@/src/frontend/src/services/holidaysService';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dropdown-menu';

export default function FeriadosPage() {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<number | null>(null);
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: '',
    is_mandatory_pay: false,
    allow_triple_overtime: false,
    status: 'active'
  });
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const data = await holidaysService.getAll();
      setHolidays(data);
      setError(null);
    } catch (err) {
      setError('Failed to load holidays');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newHoliday = await holidaysService.create(holidayForm);
      setHolidays([...holidays, newHoliday]);
      setHolidayForm({
        name: '',
        date: '',
        is_mandatory_pay: false,
        allow_triple_overtime: false,
        status: 'active'
      });
    } catch (err) {
      setError('Failed to create holiday');
      console.error(err);
    }
  };

  const handleUpdateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHoliday) return;
    
    try {
      const updatedHoliday = await holidaysService.update(editingHoliday, holidayForm);
      setHolidays(holidays.map(h => 
        h.company_holidays_id === editingHoliday ? updatedHoliday : h
      ));
      setEditingHoliday(null);
      setHolidayForm({
        name: '',
        date: '',
        is_mandatory_pay: false,
        allow_triple_overtime: false,
        status: 'active'
      });
    } catch (err) {
      setError('Failed to update holiday');
      console.error(err);
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    try {
      await holidaysService.delete(id);
      setHolidays(holidays.filter(h => h.company_holidays_id !== id));
    } catch (err) {
      setError('Failed to delete holiday');
      console.error(err);
    }
  };

  const handleGenerateHolidays = async () => {
    try {
      // This would call the batch endpoint to generate standard holidays
      const result = await holidaysService.createMany([]); // In real implementation, this would generate actual holidays
      await fetchHolidays();
      setGenerateModalOpen(false);
    } catch (err) {
      setError('Failed to generate holidays');
      console.error(err);
    }
  };

  if (loading) return <div>Loading holidays...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Configuración de Feriados</h1>
      
      {/* Form to add/edit holiday */}
      <form onSubmit={editingHoliday ? handleUpdateHoliday : handleCreateHoliday} className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-medium mb-4">
          {editingHoliday ? 'Editar Feriado' : 'Agregar Nuevo Feriado'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">Nombre</label>
            <Input
              value={holidayForm.name}
              onChange={(e) => setHolidayForm({...holidayForm, name: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block mb-2">Fecha</label>
            <Input
              type="date"
              value={holidayForm.date}
              onChange={(e) => setHolidayForm({...holidayForm, date: e.target.value})}
              required
            />
          </div>
          <div className="flex items-start">
            <Switch
              checked={holidayForm.is_mandatory_pay}
              onCheckedChange={(checked) => setHolidayForm({...holidayForm, is_mandatory_pay: checked})}
            />
            <span className="ml-3">Pago obligatorio (2x)</span>
          </div>
          <div className="flex items-start">
            <Switch
              checked={holidayForm.allow_triple_overtime}
              onCheckedChange={(checked) => setHolidayForm({...holidayForm, allow_triple_overtime: checked})}
            />
            <span className="ml-3">Permite triple tiempo extra (3x)</span>
          </div>
          <div>
            <label className="block mb-2">Estado</label>
            <Input
              value={holidayForm.status}
              onChange={(e) => setHolidayForm({...holidayForm, status: e.target.value})}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={() => {
            setEditingHoliday(null);
            setHolidayForm({
              name: '',
              date: '',
              is_mandatory_pay: false,
              allow_triple_overtime: false,
              status: 'active'
            });
          }} className="mr-2">
            Cancelar
          </Button>
          <Button type="submit">
            {editingHoliday ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>

      {/* Generate standard holidays button */}
      <Button onClick={() => setGenerateModalOpen(true)} className="mb-4">
        Generar Semana Santa automáticamente
      </Button>

      {/* Holidays table */}
      <Table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Fecha</th>
            <th>Pago Obligatorio</th>
            <th>Triple Hora Extra</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {holidays.map(holiday => (
            <tr key={holiday.company_holidays_id}>
              <td>{holiday.company_holidays_name}</td>
              <td>{new Date(holiday.company_holidays_date).toLocaleDateString()}</td>
              <td>{holiday.company_holidays_is_mandatory ? 'Sí' : 'No'}</td>
              <td>{holiday.company_holidays_is_triple ? 'Sí' : 'No'}</td>
              <td>{holiday.company_holidays_status}</td>
              <td className="flex space-x-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingHoliday(holiday.company_holidays_id);
                    setHolidayForm({
                      name: holiday.company_holidays_name,
                      date: holiday.company_holidays_date.split('T')[0],
                      is_mandatory_pay: holiday.company_holidays_is_mandatory,
                      allow_triple_overtime: holiday.company_holidays_is_triple,
                      status: holiday.company_holidays_status
                    });
                  }}
                >
                  Editar
                </Button>
                <Button 
                  variant="destructive"
                  outline
                  size="sm"
                  onClick={() => handleDeleteHoliday(holiday.company_holidays_id)}
                >
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
          {holidays.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center py-4">
                No hay feriados configurados
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      
      {/* Generate holidays modal */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogTrigger asChild>
          <Button>Generar Semana Santa</Button>
        </DialogTrigger>
        <DialogContent className="w-96">
          <DialogHeader>
            <DialogTitle>Generar Semana Santa</DialogTitle>
            <DialogDescription>
              Esto creará automáticamente los feriados de Semana Santa para el año actual
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setGenerateModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleGenerateHolidays}>Generar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}