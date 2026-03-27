import { prisma } from '../lib/prisma';
import nodemailer from "nodemailer";
import path from "path";
import { promises as fs } from "fs";
import { roundToMoney } from "../utils/payrollUtils";
const REPORT_TYPES = ["CCSS", "HACIENDA"] as const;
const STORAGE_ROOT =
  process.env.REPORTS_OUTPUT_DIR || path.join(process.cwd(), "storage", "reports");

export type OfficialReportType = (typeof REPORT_TYPES)[number];

export interface ReportablePayrollSummary {
  id: number;
  label: string;
  period_start: string;
  period_end: string;
  payment_date: string | null;
  status: string;
  total_employees: number;
  total_gross: number;
  total_net: number;
  last_sent_at?: string;
  last_sent_type?: OfficialReportType;
  last_sent_status?: string;
}

export interface ReportTargetSummary {
  id: number;
  institution: string;
  endpoint_url: string;
  contact_email: string;
}

export interface EnterpriseProfile {
  id: number | null;
  name: string;
  taxId: string;
}

export interface PayrollEmployeeReportRow {
  payrollEmployeeId: number;
  employeeId: number;
  fullName: string;
  email: string | null;
  socialSecurityCode?: string | null;
  nationalId?: string | null;
  position?: string | null;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  deductions: Array<{ id: number; name: string; amount: number }>;
  lastDispatch?: ReportLogEntryDto;
}

export interface PayrollReportDataset {
  payroll: {
    id: number;
    period_start: string;
    period_end: string;
    payment_date: string | null;
    status: string;
    total_employees: number;
    total_gross: number;
    total_net: number;
  };
  employer: EnterpriseProfile;
  employees: PayrollEmployeeReportRow[];
}

export interface ReportLogEntryDto {
  id: number;
  type: OfficialReportType;
  status: string;
  generated_at: string;
  period_start: string;
  period_end: string;
  file_path: string;
  payrollId?: number;
  employeeId?: number;
  employeeName?: string;
}

export interface ReportDispatchResult {
  employeeId: number;
  employeeName: string;
  email?: string | null;
  status: "sent" | "skipped" | "failed";
  detail: string;
  reportTypes: OfficialReportType[];
  attachments: string[];
}

export interface ReportDispatchSummary {
  requested: number;
  sent: number;
  failed: number;
  reportTypes: OfficialReportType[];
  results: ReportDispatchResult[];
}

interface DatasetOptions {
  employeeIds?: number[];
}

interface SendReportsInput {
  payrollId: number;
  employeeIds?: number[];
  reportTypes: OfficialReportType[];
  cc?: string[];
  customMessage?: string;
  requesterUserId: number;
}

interface MailSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure?: boolean;
  requireTLS?: boolean;
}

interface PersistedXml {
  fileName: string;
  fullPath: string;
  relativePath: string;
}

export class ReportsService {
  static async getDashboard(): Promise<{
    payrolls: ReportablePayrollSummary[];
    targets: ReportTargetSummary[];
    availableReportTypes: OfficialReportType[];
  }> {
    const payrolls = await prisma.vpg_payrolls.findMany({
      orderBy: { payrolls_payment_date: "desc" },
      take: 15,
    });

    if (payrolls.length === 0) {
      return { payrolls: [], targets: [], availableReportTypes: [...REPORT_TYPES] };
    }

    const payrollIds = payrolls.map((p) => p.payrolls_id);
    const aggregates = await prisma.vpg_payroll_employee.groupBy({
      by: ["payroll_employee_payroll_id"],
      where: { payroll_employee_payroll_id: { in: payrollIds } },
      _sum: {
        payroll_employee_gross_salary: true,
        payroll_employee_net_salary: true,
      },
      _count: { _all: true },
    });

    const aggregateMap = new Map<
      number,
      { gross: number; net: number; count: number }
    >();
    for (const agg of aggregates) {
      const gross = Number(agg._sum.payroll_employee_gross_salary || 0);
      const net = Number(agg._sum.payroll_employee_net_salary || 0);
      aggregateMap.set(agg.payroll_employee_payroll_id, {
        gross,
        net,
        count: agg._count._all,
      });
    }

    const summaries: ReportablePayrollSummary[] = [];
    for (const payroll of payrolls) {
      const stats = aggregateMap.get(payroll.payrolls_id) ?? {
        gross: 0,
        net: 0,
        count: 0,
      };

      const lastLog = await prisma.vpg_report_logs.findFirst({
        where: {
          report_logs_file_path: { contains: `/payroll-${payroll.payrolls_id}/` },
        },
        orderBy: { report_logs_generated_at: "desc" },
      });

      summaries.push({
        id: payroll.payrolls_id,
        label: `#${payroll.payrolls_id} · ${this.formatDate(payroll.payrolls_period_start)} → ${this.formatDate(
          payroll.payrolls_period_end
        )}`,
        period_start: payroll.payrolls_period_start.toISOString(),
        period_end: payroll.payrolls_period_end.toISOString(),
        payment_date: payroll.payrolls_payment_date
          ? payroll.payrolls_payment_date.toISOString()
          : null,
        status: payroll.payrolls_status,
        total_employees: stats.count,
        total_gross: roundToMoney(stats.gross),
        total_net: roundToMoney(stats.net),
        last_sent_at: lastLog ? lastLog.report_logs_generated_at.toISOString() : undefined,
        last_sent_type: lastLog
          ? (lastLog.report_logs_report_type as OfficialReportType)
          : undefined,
        last_sent_status: lastLog?.report_logs_status,
      });
    }

    const targetsRaw = await prisma.vpg_report_targets.findMany({
      orderBy: { report_targets_institution: "asc" },
    });

    const targets: ReportTargetSummary[] = targetsRaw.map((target) => ({
      id: target.report_targets_id,
      institution: target.report_targets_institution,
      endpoint_url: target.report_targets_endpoint_url,
      contact_email: target.report_targets_contact_email,
    }));

    return {
      payrolls: summaries,
      targets,
      availableReportTypes: [...REPORT_TYPES],
    };
  }

  static async getPayrollDataset(
    payrollId: number,
    options: DatasetOptions = {}
  ): Promise<PayrollReportDataset> {
    const payroll = await prisma.vpg_payrolls.findUnique({
      where: { payrolls_id: payrollId },
    });

    if (!payroll) {
      throw new Error("Planilla no encontrada");
    }

    const employer = await this.getEnterpriseProfile();
    const whereClause: any = { payroll_employee_payroll_id: payrollId };

    if (options.employeeIds && options.employeeIds.length > 0) {
      whereClause.payroll_employee_employee_id = {
        in: options.employeeIds,
      };
    }

    const employees = await prisma.vpg_payroll_employee.findMany({
      where: whereClause,
      orderBy: { payroll_employee_id: "asc" },
      include: {
        vpg_employees: {
          select: {
            employee_id: true,
            employee_first_name: true,
            employee_last_name: true,
            employee_middle_name: true,
            employee_email: true,
            employee_social_code: true,
            employee_national_id: true,
            vpg_positions: { select: { position_name: true } },
          },
        },
      },
    });

    const employeeIds = employees.map((row) => row.payroll_employee_employee_id);

    const deductionRows =
      employeeIds.length > 0
        ? await prisma.vpg_employee_deductions.findMany({
            where: {
              employee_deductions_payroll_id: payrollId,
              employee_deductions_employee_id: { in: employeeIds },
            },
            include: { vpg_deductions: { select: { deductions_name: true } } },
          })
        : [];

    const deductionMap = new Map<
      number,
      Array<{ id: number; name: string; amount: number }>
    >();

    for (const deduction of deductionRows) {
      const collection =
        deductionMap.get(deduction.employee_deductions_employee_id) ?? [];
      collection.push({
        id: deduction.employee_deductions_deduction_id,
        name:
          deduction.vpg_deductions?.deductions_name ||
          `Deducción ${deduction.employee_deductions_deduction_id}`,
        amount: Number(deduction.employee_deductions_amount),
      });
      deductionMap.set(deduction.employee_deductions_employee_id, collection);
    }

    const logRows =
      employeeIds.length > 0
        ? await prisma.vpg_report_logs.findMany({
            where: {
              OR: employeeIds.map((id) => ({
                report_logs_file_path: { contains: `/employee-${id}-` },
              })),
            },
            orderBy: { report_logs_generated_at: "desc" },
          })
        : [];

    const logByEmployee = new Map<number, ReportLogEntryDto>();
    for (const log of logRows) {
      const employeeId = this.extractEmployeeIdFromPath(log.report_logs_file_path);
      if (!employeeId || logByEmployee.has(employeeId)) continue;
      logByEmployee.set(employeeId, this.mapReportLog(log, employeeId));
    }

    const employeeData: PayrollEmployeeReportRow[] = employees.map((row) => {
      const base = row.vpg_employees;
      return {
        payrollEmployeeId: row.payroll_employee_id,
        employeeId: row.payroll_employee_employee_id,
        fullName: this.buildEmployeeName(
          base.employee_first_name,
          base.employee_last_name,
          base.employee_middle_name
        ),
        email: base.employee_email,
        socialSecurityCode: base.employee_social_code,
        nationalId: base.employee_national_id,
        position: base.vpg_positions?.position_name,
        grossSalary: Number(row.payroll_employee_gross_salary),
        totalDeductions: Number(row.payroll_employee_total_deductions),
        netSalary: Number(row.payroll_employee_net_salary),
        deductions: deductionMap.get(row.payroll_employee_employee_id) ?? [],
        lastDispatch: logByEmployee.get(row.payroll_employee_employee_id),
      };
    });

    const totals = employeeData.reduce(
      (acc, row) => {
        acc.gross += row.grossSalary;
        acc.net += row.netSalary;
        return acc;
      },
      { gross: 0, net: 0 }
    );

    return {
      payroll: {
        id: payroll.payrolls_id,
        period_start: payroll.payrolls_period_start.toISOString(),
        period_end: payroll.payrolls_period_end.toISOString(),
        payment_date: payroll.payrolls_payment_date
          ? payroll.payrolls_payment_date.toISOString()
          : null,
        status: payroll.payrolls_status,
        total_employees: employeeData.length,
        total_gross: roundToMoney(totals.gross),
        total_net: roundToMoney(totals.net),
      },
      employer,
      employees: employeeData,
    };
  }

  static async getReportLogs(payrollId: number): Promise<ReportLogEntryDto[]> {
    const logs = await prisma.vpg_report_logs.findMany({
      where: {
        report_logs_file_path: { contains: `/payroll-${payrollId}/` },
      },
      orderBy: { report_logs_generated_at: "desc" },
      take: 50,
    });

    const employeeIds = Array.from(
      new Set(
        logs
          .map((log) => this.extractEmployeeIdFromPath(log.report_logs_file_path))
          .filter((value): value is number => Boolean(value))
      )
    );

    const employees =
      employeeIds.length > 0
        ? await prisma.vpg_employees.findMany({
            where: { employee_id: { in: employeeIds } },
            select: {
              employee_id: true,
              employee_first_name: true,
              employee_last_name: true,
              employee_middle_name: true,
            },
          })
        : [];

    const employeeNameMap = new Map<number, string>();
    for (const employee of employees) {
      employeeNameMap.set(
        employee.employee_id,
        this.buildEmployeeName(
          employee.employee_first_name,
          employee.employee_last_name,
          employee.employee_middle_name
        )
      );
    }

    return logs.map((log) => {
      const employeeId = this.extractEmployeeIdFromPath(log.report_logs_file_path);
      const dto = this.mapReportLog(log, employeeId ?? undefined);
      if (employeeId) {
        dto.employeeName = employeeNameMap.get(employeeId);
      }
      return dto;
    });
  }

  static async sendReports(input: SendReportsInput): Promise<ReportDispatchSummary> {
    const normalizedTypes = this.normalizeReportTypes(input.reportTypes);
    if (normalizedTypes.length === 0) {
      throw new Error("Debe seleccionar al menos un tipo de reporte");
    }

    const dataset = await this.getPayrollDataset(input.payrollId, {
      employeeIds: input.employeeIds,
    });

    const employees = dataset.employees;
    if (!employees.length) {
      throw new Error("No hay empleados configurados para esta planilla");
    }

    const ccList = (input.cc || [])
      .map((value) => value?.trim())
      .filter((value) => value && value.includes("@"));

    const { transporter, settings } = await this.createTransporter();
    const reportRange = `${this.formatDateHuman(dataset.payroll.period_start)} - ${this.formatDateHuman(
      dataset.payroll.period_end
    )}`;

    const results: ReportDispatchResult[] = [];

    for (const employee of employees) {
      if (!employee.email) {
        results.push({
          employeeId: employee.employeeId,
          employeeName: employee.fullName,
          email: null,
          status: "skipped",
          detail: "El empleado no tiene un correo configurado",
          reportTypes: normalizedTypes,
          attachments: [],
        });
        continue;
      }

      const attachments: { filename: string; content: string; relativePath: string; logId?: number }[] = [];

      for (const type of normalizedTypes) {
        const xml = this.buildReportXml(type, dataset, employee);
        const persisted = await this.persistXmlFile(
          dataset.payroll.id,
          employee.employeeId,
          type,
          xml
        );
        const log = await prisma.vpg_report_logs.create({
          data: {
            report_logs_report_type: type,
            report_logs_generated_by: input.requesterUserId,
            report_logs_generated_at: new Date(),
            report_logs_period_start: new Date(dataset.payroll.period_start),
            report_logs_period_end: new Date(dataset.payroll.period_end),
            report_logs_file_path: persisted.relativePath,
            report_logs_status: "GENERATED",
          },
        });

        attachments.push({
          filename: persisted.fileName,
          content: xml,
          relativePath: persisted.relativePath,
          logId: log.report_logs_id,
        });
      }

      const summaryItems = [
        `<li><strong>Bruto:</strong> ${this.formatCurrency(employee.grossSalary)}</li>`,
        `<li><strong>Deducciones:</strong> ${this.formatCurrency(employee.totalDeductions)}</li>`,
        `<li><strong>Neto:</strong> ${this.formatCurrency(employee.netSalary)}</li>`,
      ].join("");

      const customMessage = input.customMessage
        ? `<p class="text-sm text-neutral-700">${this.escapeHtml(input.customMessage).replace(/\n/g, "<br />")}</p>`
        : "";

      const htmlBody = `
        <p>Hola ${this.escapeHtml(employee.fullName)},</p>
        <p>Adjuntamos tus comprobantes oficiales (${normalizedTypes.join(
          " & "
        )}) correspondientes al período ${this.escapeHtml(reportRange)}.</p>
        ${customMessage}
        <ul>${summaryItems}</ul>
        <p>Este mensaje fue enviado automáticamente por ${this.escapeHtml(
          dataset.employer.name
        )}.</p>
      `;

      const textBody = [
        `Hola ${employee.fullName},`,
        `Adjuntamos tus comprobantes oficiales (${normalizedTypes.join(
          " & "
        )}) del período ${reportRange}.`,
        `Bruto: ${this.formatCurrency(employee.grossSalary)}`,
        `Deducciones: ${this.formatCurrency(employee.totalDeductions)}`,
        `Neto: ${this.formatCurrency(employee.netSalary)}`,
        "",
        "Este mensaje fue generado automáticamente.",
      ].join("\n");

      try {
        await transporter.sendMail({
          from: settings.from,
          to: employee.email,
          cc: ccList.length > 0 ? ccList : undefined,
          subject: `Comprobantes ${reportRange} - ${dataset.employer.name}`,
          html: htmlBody,
          text: textBody,
          attachments: attachments.map((attachment) => ({
            filename: attachment.filename,
            content: attachment.content,
            contentType: "application/xml",
          })),
        });

        for (const attachment of attachments) {
          if (attachment.logId) {
            await prisma.vpg_report_logs.update({
              where: { report_logs_id: attachment.logId },
              data: { report_logs_status: "SENT" },
            });
          }
        }

        results.push({
          employeeId: employee.employeeId,
          employeeName: employee.fullName,
          email: employee.email,
          status: "sent",
          detail: `Se enviaron ${attachments.length} adjuntos`,
          reportTypes: normalizedTypes,
          attachments: attachments.map((item) => item.relativePath),
        });
      } catch (error) {
        for (const attachment of attachments) {
          if (attachment.logId) {
            await prisma.vpg_report_logs.update({
              where: { report_logs_id: attachment.logId },
              data: { report_logs_status: "FAILED" },
            });
          }
        }

        const message =
          error instanceof Error
            ? error.message
            : "No se pudo enviar el correo electrónico";

        results.push({
          employeeId: employee.employeeId,
          employeeName: employee.fullName,
          email: employee.email,
          status: "failed",
          detail: message,
          reportTypes: normalizedTypes,
          attachments: attachments.map((item) => item.relativePath),
        });
      }
    }

    const summary: ReportDispatchSummary = {
      requested: employees.length,
      sent: results.filter((result) => result.status === "sent").length,
      failed: results.filter((result) => result.status === "failed").length,
      reportTypes: normalizedTypes,
      results,
    };

    return summary;
  }

  private static normalizeReportTypes(
    types?: string[]
  ): OfficialReportType[] {
    const source = types && types.length > 0 ? types : REPORT_TYPES;
    const normalized = source
      .map((value) => value?.toUpperCase().trim())
      .filter((value): value is OfficialReportType =>
        REPORT_TYPES.includes(value as OfficialReportType)
      );
    return Array.from(new Set(normalized));
  }

  private static async ensureStorageDir(payrollId: number): Promise<string> {
    const dir = path.join(STORAGE_ROOT, `payroll-${payrollId}`);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  private static async persistXmlFile(
    payrollId: number,
    employeeId: number,
    type: OfficialReportType,
    xml: string
  ): Promise<PersistedXml> {
    const dir = await this.ensureStorageDir(payrollId);
    const fileName = `employee-${employeeId}-${type.toLowerCase()}-${Date.now()}.xml`;
    const fullPath = path.join(dir, fileName);
    await fs.writeFile(fullPath, xml, "utf8");
    const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");
    return { fileName, fullPath, relativePath };
  }

  private static formatDate(date: Date | string): string {
    const value = typeof date === "string" ? new Date(date) : date;
    return value.toISOString().split("T")[0];
  }

  private static formatDateHuman(date: string): string {
    const value = new Date(date);
    return value.toLocaleDateString("es-CR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  private static buildEmployeeName(
    firstName?: string | null,
    lastName?: string | null,
    middleName?: string | null
  ): string {
    return [firstName, lastName, middleName]
      .filter((part) => Boolean(part && part.trim()))
      .join(" ")
      .trim();
  }

  private static buildReportXml(
    type: OfficialReportType,
    dataset: PayrollReportDataset,
    employee: PayrollEmployeeReportRow
  ): string {
    const timestamp = new Date().toISOString();
    const deductionsXml =
      employee.deductions.length > 0
        ? employee.deductions
            .map(
              (deduction) => `
        <Deduction>
          <Name>${this.escapeHtml(deduction.name)}</Name>
          <Amount currency="CRC">${deduction.amount.toFixed(2)}</Amount>
        </Deduction>`
            )
            .join("")
        : "<Deduction><Name>Sin deducciones</Name><Amount currency=\"CRC\">0.00</Amount></Deduction>";

    if (type === "CCSS") {
      return `<?xml version="1.0" encoding="UTF-8"?>
<CCSSPayrollReport version="1.0">
  <GeneratedAt>${timestamp}</GeneratedAt>
  <Employer>
    <Name>${this.escapeHtml(dataset.employer.name)}</Name>
    <TaxId>${this.escapeHtml(dataset.employer.taxId)}</TaxId>
  </Employer>
  <Payroll>
    <Id>${dataset.payroll.id}</Id>
    <PeriodStart>${this.formatDate(dataset.payroll.period_start)}</PeriodStart>
    <PeriodEnd>${this.formatDate(dataset.payroll.period_end)}</PeriodEnd>
    <PaymentDate>${dataset.payroll.payment_date ? this.formatDate(dataset.payroll.payment_date) : ""}</PaymentDate>
  </Payroll>
  <Employee>
    <InternalId>${employee.payrollEmployeeId}</InternalId>
    <Name>${this.escapeHtml(employee.fullName)}</Name>
    <NationalId>${this.escapeHtml(employee.nationalId || "")}</NationalId>
    <SocialSecurityCode>${this.escapeHtml(employee.socialSecurityCode || "")}</SocialSecurityCode>
    <Position>${this.escapeHtml(employee.position || "Sin posición")}</Position>
  </Employee>
  <Salary>
    <Gross>${employee.grossSalary.toFixed(2)}</Gross>
    <TotalDeductions>${employee.totalDeductions.toFixed(2)}</TotalDeductions>
    <Net>${employee.netSalary.toFixed(2)}</Net>
  </Salary>
  <Deductions>
    ${deductionsXml}
  </Deductions>
</CCSSPayrollReport>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<HaciendaIncomeReport version="1.0">
  <GeneratedAt>${timestamp}</GeneratedAt>
  <Employer>
    <Name>${this.escapeHtml(dataset.employer.name)}</Name>
    <TaxId>${this.escapeHtml(dataset.employer.taxId)}</TaxId>
  </Employer>
  <Payroll>
    <Id>${dataset.payroll.id}</Id>
    <PeriodStart>${this.formatDate(dataset.payroll.period_start)}</PeriodStart>
    <PeriodEnd>${this.formatDate(dataset.payroll.period_end)}</PeriodEnd>
  </Payroll>
  <Employee>
    <InternalId>${employee.payrollEmployeeId}</InternalId>
    <Name>${this.escapeHtml(employee.fullName)}</Name>
    <NationalId>${this.escapeHtml(employee.nationalId || "")}</NationalId>
    <Email>${this.escapeHtml(employee.email || "")}</Email>
  </Employee>
  <IncomeBreakdown>
    <Gross>${employee.grossSalary.toFixed(2)}</Gross>
    <Deductions>${employee.totalDeductions.toFixed(2)}</Deductions>
    <Net>${employee.netSalary.toFixed(2)}</Net>
  </IncomeBreakdown>
  <Deductions>
    ${deductionsXml}
  </Deductions>
</HaciendaIncomeReport>`;
  }

  private static async resolveMailSettings(): Promise<MailSettings> {
    const host =
      process.env.REPORTS_SMTP_HOST ||
      process.env.SMTP_HOST ||
      process.env.EMAIL_HOST;
    const portString =
      process.env.REPORTS_SMTP_PORT ||
      process.env.SMTP_PORT ||
      process.env.EMAIL_PORT;
    const user =
      process.env.REPORTS_SMTP_USER ||
      process.env.SMTP_USER ||
      process.env.EMAIL_USER;
    const pass =
      process.env.REPORTS_SMTP_PASS ||
      process.env.SMTP_PASS ||
      process.env.EMAIL_PASS;
    const from =
      process.env.REPORTS_FROM ||
      process.env.SMTP_FROM ||
      process.env.EMAIL_FROM ||
      user;
    const secure =
      (process.env.REPORTS_SMTP_SECURE || process.env.SMTP_SECURE || "false")
        .toLowerCase()
        .trim() === "true";
    const requireTLS =
      (process.env.REPORTS_SMTP_TLS || process.env.SMTP_TLS || "false")
        .toLowerCase()
        .trim() === "true";

    if (host && portString && user && pass && from) {
      return {
        host,
        port: Number(portString),
        user,
        pass,
        from,
        secure,
        requireTLS,
      };
    }

    const server = await prisma.vpg_mail_server_settings.findFirst({
      orderBy: { mail_server_settings_id: "desc" },
    });

    if (!server) {
      throw new Error(
        "No hay configuración de servidor de correo disponible. Configure variables SMTP."
      );
    }

    return {
      host: server.mail_server_settings_host,
      port: server.mail_server_settings_port,
      user: server.mail_server_settings_username,
      pass: server.mail_server_settings_password,
      from: server.mail_server_settings_from_address,
      secure: server.mail_server_settings_use_ssl,
      requireTLS: server.mail_server_settings_use_tls,
    };
  }

  private static async createTransporter(): Promise<{
    transporter: nodemailer.Transporter;
    settings: MailSettings;
  }> {
    const settings = await this.resolveMailSettings();
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure:
        typeof settings.secure === "boolean"
          ? settings.secure
          : settings.port === 465,
      auth: { user: settings.user, pass: settings.pass },
      tls: settings.requireTLS
        ? { rejectUnauthorized: false }
        : undefined,
    });
    return { transporter, settings };
  }

  private static extractEmployeeIdFromPath(filePath: string): number | null {
    const match = filePath.match(/employee-(\d+)-/);
    return match ? Number(match[1]) : null;
  }

  private static extractPayrollIdFromPath(filePath: string): number | null {
    const match = filePath.match(/payroll-(\d+)/);
    return match ? Number(match[1]) : null;
  }

  private static escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => {
      switch (char) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#39;";
        default:
          return char;
      }
    });
  }

  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
    }).format(value);
  }

  private static async getEnterpriseProfile(): Promise<EnterpriseProfile> {
    try {
      const enterprise = await prisma.vpg_enterprise.findFirst({
        orderBy: { enterprise_id: "asc" },
        select: {
          enterprise_id: true,
          enterprise_name: true,
        },
      });

      return {
        id: enterprise?.enterprise_id ?? null,
        name:
          enterprise?.enterprise_name ||
          process.env.REPORTS_ENTERPRISE_NAME ||
          "VP-Planillas",
        taxId: process.env.REPORTS_ENTERPRISE_TAX_ID || "DESCONOCIDO",
      };
    } catch (error) {
      console.warn(
        "[reports] No se pudo leer vpg_enterprise, usando valores de entorno:",
        error
      );
      return {
        id: null,
        name: process.env.REPORTS_ENTERPRISE_NAME || "VP-Planillas",
        taxId: process.env.REPORTS_ENTERPRISE_TAX_ID || "DESCONOCIDO",
      };
    }
  }

  private static mapReportLog(
    log: any,
    employeeId?: number
  ): ReportLogEntryDto {
    return {
      id: log.report_logs_id,
      type: log.report_logs_report_type as OfficialReportType,
      status: log.report_logs_status,
      generated_at: log.report_logs_generated_at.toISOString(),
      period_start: log.report_logs_period_start.toISOString(),
      period_end: log.report_logs_period_end.toISOString(),
      file_path: log.report_logs_file_path,
      payrollId: this.extractPayrollIdFromPath(log.report_logs_file_path) ?? undefined,
      employeeId,
    };
  }
}
