import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Limpiando datos transaccionales...");

  // Delete in reverse FK dependency order (users are preserved)
  await prisma.vpg_clock_log_adjustments.deleteMany({});
  await prisma.vpg_clock_logs.deleteMany({});
  await prisma.vpg_clock_import_sessions.deleteMany({});
  await prisma.vpg_payroll_recalculations.deleteMany({});
  await prisma.vpg_employee_deductions.deleteMany({});
  await prisma.vpg_payroll_employee.deleteMany({});
  await prisma.vpg_bonuses.deleteMany({});
  await prisma.vpg_payrolls.deleteMany({});
  await prisma.vpg_vacations.deleteMany({});
  await prisma.vpg_employee_labor_event.deleteMany({});
  await prisma.vpg_employee_documents.deleteMany({});
  await prisma.vpg_deductions_per_employee.deleteMany({});
  await prisma.vpg_notifications.deleteMany({});
  await prisma.vpg_audit_logs.deleteMany({});
  await prisma.vpg_report_versions.deleteMany({});
  await prisma.vpg_report_logs.deleteMany({});
  await prisma.vpg_token_blocklist.deleteMany({});
  await prisma.vpg_password_change_request.deleteMany({});
  await prisma.vpg_employees.deleteMany({});

  console.log("✅ Datos transaccionales eliminados (usuarios conservados).");

  // Re-seed catalog: positions
  console.log("🌱 Sembrando posiciones...");
  await prisma.vpg_positions.deleteMany({});
  const positions = await prisma.vpg_positions.createManyAndReturn({
    data: [
      { position_name: "Desarrollador", position_description: "Desarrollador de software", position_base_salary: 800000 },
      { position_name: "Contador", position_description: "Contador general", position_base_salary: 700000 },
      { position_name: "Recursos Humanos", position_description: "Gestión de personal", position_base_salary: 650000 },
      { position_name: "Gerente", position_description: "Gerente de área", position_base_salary: 1200000 },
      { position_name: "Asistente", position_description: "Asistente administrativo", position_base_salary: 500000 },
    ],
  });
  console.log(`   ${positions.length} posiciones creadas.`);

  // Re-seed catalog: payroll types
  console.log("🌱 Sembrando tipos de planilla...");
  await prisma.vpg_payroll_types.deleteMany({});
  const payrollTypes = await prisma.vpg_payroll_types.createManyAndReturn({
    data: [
      { payroll_types_name: "Quincenal", payroll_types_description: "Planilla quincenal (cada 15 días)" },
      { payroll_types_name: "Mensual", payroll_types_description: "Planilla mensual" },
      { payroll_types_name: "Semanal", payroll_types_description: "Planilla semanal" },
    ],
  });
  console.log(`   ${payrollTypes.length} tipos de planilla creados.`);

  // Re-seed catalog: deductions
  console.log("🌱 Sembrando deducciones CCSS...");
  await prisma.vpg_deductions.deleteMany({});
  const deductions = await prisma.vpg_deductions.createManyAndReturn({
    data: [
      { deductions_name: "CCSS", deductions_description: "Aporte CCSS 10.67%", deductions_percentage: 10.67 },
      { deductions_name: "Impuesto Renta", deductions_description: "Impuesto sobre la Renta 10%", deductions_percentage: 10 },
      { deductions_name: "SEM", deductions_description: "Seguro de Enfermedad y Maternidad 5.5%", deductions_percentage: 5.5 },
      { deductions_name: "IVM", deductions_description: "Invalidez, Vejez y Muerte 2.84%", deductions_percentage: 2.84 },
    ],
  });
  console.log(`   ${deductions.length} deducciones creadas.`);

  // Re-seed catalog: labor events
  console.log("🌱 Sembrando eventos laborales...");
  await prisma.vpg_labor_events.deleteMany({});
  await prisma.vpg_labor_events.createMany({
    data: [
      { labor_events_name: "Incapacidad", labor_events_description: "Incapacidad médica" },
      { labor_events_name: "Permiso con goce", labor_events_description: "Permiso con goce de salario" },
      { labor_events_name: "Permiso sin goce", labor_events_description: "Permiso sin goce de salario" },
      { labor_events_name: "Suspensión", labor_events_description: "Suspensión disciplinaria" },
    ],
  });
  console.log("   Eventos laborales creados.");

  console.log("\n🎉 Base de datos lista para pruebas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
