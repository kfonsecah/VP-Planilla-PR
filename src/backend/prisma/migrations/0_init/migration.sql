-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "vpg_audit_logs" (
    "audit_logs_id" SERIAL NOT NULL,
    "audit_logs_user_id" INTEGER NOT NULL,
    "audit_logs_action" VARCHAR(100) NOT NULL,
    "audit_logs_entity" VARCHAR(100) NOT NULL,
    "audit_logs_entity_id" INTEGER NOT NULL,
    "audit_logs_timestamp" TIMESTAMP(6) NOT NULL,
    "audit_logs_details" TEXT,

    CONSTRAINT "vpg_audit_logs_pkey" PRIMARY KEY ("audit_logs_id")
);

-- CreateTable
CREATE TABLE "vpg_bonuses" (
    "bonuses_id" SERIAL NOT NULL,
    "bonuses_employee_id" INTEGER NOT NULL,
    "bonuses_payroll_id" INTEGER NOT NULL,
    "bonuses_year" INTEGER NOT NULL,
    "bonuses_month" INTEGER NOT NULL,
    "bonuses_description" VARCHAR(255) NOT NULL,
    "bonuses_amount" DECIMAL(10,2) NOT NULL,
    "bonuses_granted_at" DATE NOT NULL,
    "bonuses_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_bonuses_pkey" PRIMARY KEY ("bonuses_id")
);

-- CreateTable
CREATE TABLE "vpg_branch_employee" (
    "employee_branch_branch_id" INTEGER,
    "employee_branch_employee_id" INTEGER
);

-- CreateTable
CREATE TABLE "vpg_branches" (
    "branch_id" SERIAL NOT NULL,
    "branch_name" VARCHAR(50) NOT NULL,
    "branch_location" VARCHAR(100) NOT NULL,
    "branch_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_branches_pkey" PRIMARY KEY ("branch_id")
);

-- CreateTable
CREATE TABLE "vpg_clock_logs" (
    "clock_logs_id" SERIAL NOT NULL,
    "clock_logs_employee_id" INTEGER NOT NULL,
    "clock_logs_timestamp" TIMESTAMP(6) NOT NULL,
    "clock_logs_log_type" VARCHAR(10) NOT NULL,
    "clock_logs_remarks" TEXT,
    "clock_logs_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_clock_logs_pkey" PRIMARY KEY ("clock_logs_id")
);

-- CreateTable
CREATE TABLE "vpg_deductions" (
    "deductions_id" SERIAL NOT NULL,
    "deductions_name" VARCHAR(100) NOT NULL,
    "deductions_description" TEXT NOT NULL,
    "deductions_percentage" DECIMAL(5,2),
    "deductions_fixed_amount" DECIMAL(10,2),
    "deductions_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_deductions_pkey" PRIMARY KEY ("deductions_id")
);

-- CreateTable
CREATE TABLE "vpg_employee_documents" (
    "employee_documents_id" SERIAL NOT NULL,
    "employee_documents_employee_id" INTEGER NOT NULL,
    "employee_documents_file_path" VARCHAR(255) NOT NULL,
    "employee_documents_document_type" VARCHAR(50) NOT NULL,
    "employee_documents_uploaded_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "vpg_employee_documents_pkey" PRIMARY KEY ("employee_documents_id")
);

-- CreateTable
CREATE TABLE "vpg_employee_labor_event" (
    "employee_labor_event_id" SERIAL NOT NULL,
    "employee_labor_event_employee_id" INTEGER NOT NULL,
    "employee_labor_event_labor_event_id" INTEGER NOT NULL,
    "employee_labor_event_start_date" DATE NOT NULL,
    "employee_labor_event_end_date" DATE,
    "employee_labor_event_status" VARCHAR(20) NOT NULL,
    "employee_labor_event_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_employee_labor_event_pkey" PRIMARY KEY ("employee_labor_event_id")
);

-- CreateTable
CREATE TABLE "vpg_employees" (
    "employee_id" SERIAL NOT NULL,
    "employee_first_name" VARCHAR(50) NOT NULL,
    "employee_last_name" VARCHAR(50) NOT NULL,
    "employee_middle_name" VARCHAR(50) NOT NULL,
    "employee_national_id" VARCHAR(30) NOT NULL,
    "employee_social_code" VARCHAR(100) NOT NULL,
    "employee_email" VARCHAR(100) NOT NULL,
    "employee_position_id" INTEGER NOT NULL,
    "employee_hire_date" DATE NOT NULL,
    "employee_exit_date" DATE,
    "employee_fired" BOOLEAN NOT NULL DEFAULT false,
    "employee_status" CHAR(1) NOT NULL,
    "employee_required_hours_biweekly" DECIMAL(5,2),
    "employee_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_employees_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "vpg_enterprise" (
    "enterprise_id" SERIAL NOT NULL,
    "enterprise_name" VARCHAR(50) NOT NULL,
    "enterprise_image" BYTEA NOT NULL,
    "enterprise_creation_date" DATE NOT NULL,
    "enterpise_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_enterprise_pkey" PRIMARY KEY ("enterprise_id")
);

-- CreateTable
CREATE TABLE "vpg_enterprise_branch" (
    "branch_enterprise_enterprise_id" INTEGER,
    "branch_enterprise_branch_id" INTEGER
);

-- CreateTable
CREATE TABLE "vpg_labor_events" (
    "labor_events_id" SERIAL NOT NULL,
    "labor_events_name" VARCHAR(100) NOT NULL,
    "labor_events_description" TEXT NOT NULL,
    "labor_events_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_labor_events_pkey" PRIMARY KEY ("labor_events_id")
);

-- CreateTable
CREATE TABLE "vpg_mail_server_settings" (
    "mail_server_settings_id" SERIAL NOT NULL,
    "mail_server_settings_host" VARCHAR(100) NOT NULL,
    "mail_server_settings_port" INTEGER NOT NULL,
    "mail_server_settings_username" VARCHAR(100) NOT NULL,
    "mail_server_settings_password" VARCHAR(255) NOT NULL,
    "mail_server_settings_from_address" VARCHAR(100) NOT NULL,
    "mail_server_settings_use_ssl" BOOLEAN NOT NULL,
    "mail_server_settings_use_tls" BOOLEAN NOT NULL,
    "mail_server_settings_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_mail_server_settings_pkey" PRIMARY KEY ("mail_server_settings_id")
);

-- CreateTable
CREATE TABLE "vpg_payroll_employee" (
    "payroll_employee_id" SERIAL NOT NULL,
    "payroll_employee_payroll_id" INTEGER NOT NULL,
    "payroll_employee_employee_id" INTEGER NOT NULL,
    "payroll_employee_total_hours" DECIMAL(10,2),
    "payroll_employee_overtime_hours" DECIMAL(10,2),
    "payroll_employee_overtime_pay" DECIMAL(10,2),
    "payroll_employee_weekly_rest_hours" DECIMAL(10,2),
    "payroll_employee_weekly_rest_pay" DECIMAL(10,2),
    "payroll_employee_bonuses" DECIMAL(10,2),
    "payroll_employee_gross_salary" DECIMAL(10,2) NOT NULL,
    "payroll_employee_total_deductions" DECIMAL(10,2) NOT NULL,
    "payroll_employee_net_salary" DECIMAL(10,2) NOT NULL,
    "payroll_employee_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_payroll_employee_pkey" PRIMARY KEY ("payroll_employee_id")
);

-- CreateTable
CREATE TABLE "vpg_payroll_types" (
    "payroll_types_id" SERIAL NOT NULL,
    "payroll_types_name" VARCHAR(50) NOT NULL,
    "payroll_types_description" TEXT NOT NULL,
    "payroll_types_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_payroll_types_pkey" PRIMARY KEY ("payroll_types_id")
);

-- CreateTable
CREATE TABLE "vpg_payrolls" (
    "payrolls_id" SERIAL NOT NULL,
    "payrolls_payroll_type_id" INTEGER NOT NULL,
    "payrolls_period_start" DATE NOT NULL,
    "payrolls_period_end" DATE NOT NULL,
    "payrolls_payment_date" DATE NOT NULL,
    "payrolls_status" VARCHAR(20) NOT NULL,
    "payrolls_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_payrolls_pkey" PRIMARY KEY ("payrolls_id")
);

-- CreateTable
CREATE TABLE "vpg_positions" (
    "position_id" SERIAL NOT NULL,
    "position_name" VARCHAR(50) NOT NULL,
    "position_description" TEXT NOT NULL,
    "position_base_salary" DECIMAL(10,2) NOT NULL,
    "position_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_positions_pkey" PRIMARY KEY ("position_id")
);

-- CreateTable
CREATE TABLE "vpg_report_logs" (
    "report_logs_id" SERIAL NOT NULL,
    "report_logs_report_type" VARCHAR(50) NOT NULL,
    "report_logs_generated_by" INTEGER NOT NULL,
    "report_logs_generated_at" TIMESTAMP(6) NOT NULL,
    "report_logs_period_start" DATE NOT NULL,
    "report_logs_period_end" DATE NOT NULL,
    "report_logs_file_path" VARCHAR(255) NOT NULL,
    "report_logs_status" VARCHAR(20) NOT NULL,
    "report_logs_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_report_logs_pkey" PRIMARY KEY ("report_logs_id")
);

-- CreateTable
CREATE TABLE "vpg_report_targets" (
    "report_targets_id" SERIAL NOT NULL,
    "report_targets_institution" VARCHAR(100) NOT NULL,
    "report_targets_endpoint_url" VARCHAR(255) NOT NULL,
    "report_targets_auth_token" VARCHAR(255) NOT NULL,
    "report_targets_contact_email" VARCHAR(100) NOT NULL,
    "report_targets_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_report_targets_pkey" PRIMARY KEY ("report_targets_id")
);

-- CreateTable
CREATE TABLE "vpg_report_versions" (
    "report_versions_id" SERIAL NOT NULL,
    "report_versions_report_log_id" INTEGER NOT NULL,
    "report_versions_created_at" TIMESTAMP(6) NOT NULL,
    "report_versions_file_path" VARCHAR(255) NOT NULL,
    "report_versions_remarks" TEXT,

    CONSTRAINT "vpg_report_versions_pkey" PRIMARY KEY ("report_versions_id")
);

-- CreateTable
CREATE TABLE "vpg_users" (
    "user_id" SERIAL NOT NULL,
    "user_first_name" VARCHAR(50) NOT NULL,
    "user_last_name" VARCHAR(50) NOT NULL,
    "user_middle_name" VARCHAR(50) NOT NULL,
    "user_national_id" VARCHAR(30) NOT NULL,
    "user_email" VARCHAR(100) NOT NULL,
    "user_username" VARCHAR(50) NOT NULL,
    "user_password" VARCHAR(255) NOT NULL,
    "user_role" VARCHAR(20) NOT NULL,
    "user_version" INTEGER NOT NULL DEFAULT 1,
    "user_last_login" TIMESTAMP(6),

    CONSTRAINT "vpg_users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "vpg_employee_deductions" (
    "employee_deductions_employee_id" INTEGER NOT NULL,
    "employee_deductions_deduction_id" INTEGER NOT NULL,
    "employee_deductions_payroll_id" INTEGER NOT NULL,
    "employee_deductions_year" INTEGER NOT NULL,
    "employee_deductions_month" INTEGER NOT NULL,
    "employee_deductions_amount" DECIMAL(10,2) NOT NULL,
    "employee_deductions_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_employee_deductions_pkey" PRIMARY KEY ("employee_deductions_employee_id","employee_deductions_deduction_id","employee_deductions_payroll_id")
);

-- CreateTable
CREATE TABLE "vpg_vacations" (
    "vacations_id" SERIAL NOT NULL,
    "vacations_employee_id" INTEGER NOT NULL,
    "vacations_start_date" DATE NOT NULL,
    "vacations_end_date" DATE NOT NULL,
    "vacations_total_days" INTEGER,
    "vacations_paid" BOOLEAN DEFAULT true,
    "vacations_status" VARCHAR(20) DEFAULT 'Aprobado',
    "vacations_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_vacations_pkey" PRIMARY KEY ("vacations_id")
);

-- CreateTable
CREATE TABLE "vpg_deductions_per_employee" (
    "deductions_per_employee_employee_id" INTEGER NOT NULL,
    "deductions_per_employee_deduction_id" INTEGER NOT NULL,
    "deductions_per_employee_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_deductions_per_employee_pkey" PRIMARY KEY ("deductions_per_employee_employee_id","deductions_per_employee_deduction_id")
);

-- CreateTable
CREATE TABLE "vpg_token_blocklist" (
    "blocklist_id" SERIAL NOT NULL,
    "blocklist_token" VARCHAR(500) NOT NULL,
    "blocklist_expires" TIMESTAMP(6) NOT NULL,
    "blocklist_created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vpg_token_blocklist_pkey" PRIMARY KEY ("blocklist_id")
);

-- CreateIndex
CREATE INDEX "idx_vpg_audit_logs_user_id" ON "vpg_audit_logs"("audit_logs_user_id");

-- CreateIndex
CREATE INDEX "idx_vpg_audit_logs_action" ON "vpg_audit_logs"("audit_logs_action");

-- CreateIndex
CREATE INDEX "idx_vpg_audit_logs_entity" ON "vpg_audit_logs"("audit_logs_entity");

-- CreateIndex
CREATE INDEX "idx_vpg_audit_logs_timestamp" ON "vpg_audit_logs"("audit_logs_timestamp");

-- CreateIndex
CREATE INDEX "idx_vpg_bonuses_employee_id" ON "vpg_bonuses"("bonuses_employee_id");

-- CreateIndex
CREATE INDEX "idx_vpg_bonuses_granted_at" ON "vpg_bonuses"("bonuses_granted_at");

-- CreateIndex
CREATE INDEX "idx_vpg_bonuses_payroll_id" ON "vpg_bonuses"("bonuses_payroll_id");

-- CreateIndex
CREATE INDEX "idx_vpg_bonuses_year_month" ON "vpg_bonuses"("bonuses_year", "bonuses_month");

-- CreateIndex
CREATE INDEX "idx_vpg_branch_employee_branch_id" ON "vpg_branch_employee"("employee_branch_branch_id");

-- CreateIndex
CREATE INDEX "idx_vpg_branch_employee_employee_id" ON "vpg_branch_employee"("employee_branch_employee_id");

-- CreateIndex
CREATE INDEX "idx_vpg_clock_logs_employee_id" ON "vpg_clock_logs"("clock_logs_employee_id");

-- CreateIndex
CREATE INDEX "idx_vpg_clock_logs_log_type" ON "vpg_clock_logs"("clock_logs_log_type");

-- CreateIndex
CREATE INDEX "idx_vpg_clock_logs_timestamp" ON "vpg_clock_logs"("clock_logs_timestamp");

-- CreateIndex
CREATE INDEX "idx_vpg_employee_documents_employee_id" ON "vpg_employee_documents"("employee_documents_employee_id");

-- CreateIndex
CREATE INDEX "idx_vpg_employee_documents_type" ON "vpg_employee_documents"("employee_documents_document_type");

-- CreateIndex
CREATE INDEX "idx_vpg_employee_labor_event_employee_id" ON "vpg_employee_labor_event"("employee_labor_event_employee_id");

-- CreateIndex
CREATE INDEX "idx_vpg_employee_labor_event_labor_event_id" ON "vpg_employee_labor_event"("employee_labor_event_labor_event_id");

-- CreateIndex
CREATE INDEX "idx_vpg_employee_labor_event_start_date" ON "vpg_employee_labor_event"("employee_labor_event_start_date");

-- CreateIndex
CREATE INDEX "idx_vpg_employee_labor_event_status" ON "vpg_employee_labor_event"("employee_labor_event_status");

-- CreateIndex
CREATE INDEX "idx_vpg_employees_position_id" ON "vpg_employees"("employee_position_id");

-- CreateIndex
CREATE INDEX "idx_vpg_employees_email" ON "vpg_employees"("employee_email");

-- CreateIndex
CREATE INDEX "idx_vpg_employees_national_id" ON "vpg_employees"("employee_national_id");

-- CreateIndex
CREATE INDEX "idx_vpg_employees_status" ON "vpg_employees"("employee_status");

-- CreateIndex
CREATE INDEX "idx_vpg_enterprise_branch_branch_id" ON "vpg_enterprise_branch"("branch_enterprise_branch_id");

-- CreateIndex
CREATE INDEX "idx_vpg_enterprise_branch_enterprise_id" ON "vpg_enterprise_branch"("branch_enterprise_enterprise_id");

-- CreateIndex
CREATE INDEX "idx_vpg_payroll_employee_employee_id" ON "vpg_payroll_employee"("payroll_employee_employee_id");

-- CreateIndex
CREATE INDEX "idx_vpg_payroll_employee_payroll_id" ON "vpg_payroll_employee"("payroll_employee_payroll_id");

-- CreateIndex
CREATE INDEX "idx_vpg_payroll_employee_composite" ON "vpg_payroll_employee"("payroll_employee_payroll_id", "payroll_employee_employee_id");

-- CreateIndex
CREATE INDEX "idx_vpg_payrolls_payroll_type_id" ON "vpg_payrolls"("payrolls_payroll_type_id");

-- CreateIndex
CREATE INDEX "idx_vpg_payrolls_period_end" ON "vpg_payrolls"("payrolls_period_end");

-- CreateIndex
CREATE INDEX "idx_vpg_payrolls_period_start" ON "vpg_payrolls"("payrolls_period_start");

-- CreateIndex
CREATE INDEX "idx_vpg_payrolls_status" ON "vpg_payrolls"("payrolls_status");

-- CreateIndex
CREATE INDEX "idx_vpg_report_logs_generated_by" ON "vpg_report_logs"("report_logs_generated_by");

-- CreateIndex
CREATE INDEX "idx_vpg_report_logs_generated_at" ON "vpg_report_logs"("report_logs_generated_at");

-- CreateIndex
CREATE INDEX "idx_vpg_report_logs_report_type" ON "vpg_report_logs"("report_logs_report_type");

-- CreateIndex
CREATE INDEX "idx_vpg_report_logs_status" ON "vpg_report_logs"("report_logs_status");

-- CreateIndex
CREATE INDEX "idx_vpg_report_versions_report_log_id" ON "vpg_report_versions"("report_versions_report_log_id");

-- CreateIndex
CREATE INDEX "idx_vpg_report_versions_created_at" ON "vpg_report_versions"("report_versions_created_at");

-- CreateIndex
CREATE INDEX "idx_vpg_users_email" ON "vpg_users"("user_email");

-- CreateIndex
CREATE INDEX "idx_vpg_users_national_id" ON "vpg_users"("user_national_id");

-- CreateIndex
CREATE INDEX "idx_vpg_users_role" ON "vpg_users"("user_role");

-- CreateIndex
CREATE INDEX "idx_vpg_users_username" ON "vpg_users"("user_username");

-- CreateIndex
CREATE INDEX "idx_vpg_employee_deductions_deduction_id" ON "vpg_employee_deductions"("employee_deductions_deduction_id");

-- CreateIndex
CREATE INDEX "idx_vpg_employee_deductions_employee_id" ON "vpg_employee_deductions"("employee_deductions_employee_id");

-- CreateIndex
CREATE INDEX "idx_vpg_employee_deductions_payroll_id" ON "vpg_employee_deductions"("employee_deductions_payroll_id");

-- CreateIndex
CREATE INDEX "idx_vpg_employee_deductions_year_month" ON "vpg_employee_deductions"("employee_deductions_year", "employee_deductions_month");

-- CreateIndex
CREATE INDEX "idx_vpg_vacations_employee_id" ON "vpg_vacations"("vacations_employee_id");

-- CreateIndex
CREATE INDEX "idx_vpg_vacations_end_date" ON "vpg_vacations"("vacations_end_date");

-- CreateIndex
CREATE INDEX "idx_vpg_vacations_start_date" ON "vpg_vacations"("vacations_start_date");

-- CreateIndex
CREATE INDEX "idx_vpg_vacations_status" ON "vpg_vacations"("vacations_status");

-- CreateIndex
CREATE INDEX "idx_token_blocklist_token" ON "vpg_token_blocklist"("blocklist_token");

-- AddForeignKey
ALTER TABLE "vpg_audit_logs" ADD CONSTRAINT "fk_vpg_audit_logs_users_21" FOREIGN KEY ("audit_logs_user_id") REFERENCES "vpg_users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_bonuses" ADD CONSTRAINT "fk_vpg_bonuses_employees_13" FOREIGN KEY ("bonuses_employee_id") REFERENCES "vpg_employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_bonuses" ADD CONSTRAINT "fk_vpg_bonuses_payrolls_14" FOREIGN KEY ("bonuses_payroll_id") REFERENCES "vpg_payrolls"("payrolls_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_branch_employee" ADD CONSTRAINT "fk_vpg_branch_employee_branches_03" FOREIGN KEY ("employee_branch_branch_id") REFERENCES "vpg_branches"("branch_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_branch_employee" ADD CONSTRAINT "fk_vpg_branch_employee_employees_04" FOREIGN KEY ("employee_branch_employee_id") REFERENCES "vpg_employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_clock_logs" ADD CONSTRAINT "fk_vpg_clock_logs_employees_16" FOREIGN KEY ("clock_logs_employee_id") REFERENCES "vpg_employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_employee_documents" ADD CONSTRAINT "fk_vpg_employee_documents_employees_06" FOREIGN KEY ("employee_documents_employee_id") REFERENCES "vpg_employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_employee_labor_event" ADD CONSTRAINT "fk_vpg_employee_labor_event_employees_17" FOREIGN KEY ("employee_labor_event_employee_id") REFERENCES "vpg_employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_employee_labor_event" ADD CONSTRAINT "fk_vpg_employee_labor_event_labor_events_18" FOREIGN KEY ("employee_labor_event_labor_event_id") REFERENCES "vpg_labor_events"("labor_events_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_employees" ADD CONSTRAINT "fk_vpg_employees_positions_05" FOREIGN KEY ("employee_position_id") REFERENCES "vpg_positions"("position_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_enterprise_branch" ADD CONSTRAINT "fk_vpg_enterprise_branch_branches_02" FOREIGN KEY ("branch_enterprise_branch_id") REFERENCES "vpg_branches"("branch_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_enterprise_branch" ADD CONSTRAINT "fk_vpg_enterprise_branch_enterprise_01" FOREIGN KEY ("branch_enterprise_enterprise_id") REFERENCES "vpg_enterprise"("enterprise_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_payroll_employee" ADD CONSTRAINT "fk_vpg_payroll_employee_employees_09" FOREIGN KEY ("payroll_employee_employee_id") REFERENCES "vpg_employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_payroll_employee" ADD CONSTRAINT "fk_vpg_payroll_employee_payrolls_08" FOREIGN KEY ("payroll_employee_payroll_id") REFERENCES "vpg_payrolls"("payrolls_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_payrolls" ADD CONSTRAINT "fk_vpg_payrolls_payroll_types_07" FOREIGN KEY ("payrolls_payroll_type_id") REFERENCES "vpg_payroll_types"("payroll_types_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_report_logs" ADD CONSTRAINT "fk_vpg_report_logs_users_19" FOREIGN KEY ("report_logs_generated_by") REFERENCES "vpg_users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_report_versions" ADD CONSTRAINT "fk_vpg_report_versions_report_logs_20" FOREIGN KEY ("report_versions_report_log_id") REFERENCES "vpg_report_logs"("report_logs_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_employee_deductions" ADD CONSTRAINT "fk_vpg_employee_deductions_deductions_11" FOREIGN KEY ("employee_deductions_deduction_id") REFERENCES "vpg_deductions"("deductions_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_employee_deductions" ADD CONSTRAINT "fk_vpg_employee_deductions_employees_10" FOREIGN KEY ("employee_deductions_employee_id") REFERENCES "vpg_employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_employee_deductions" ADD CONSTRAINT "fk_vpg_employee_deductions_payrolls_12" FOREIGN KEY ("employee_deductions_payroll_id") REFERENCES "vpg_payrolls"("payrolls_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_vacations" ADD CONSTRAINT "fk_vpg_vacations_employees_15" FOREIGN KEY ("vacations_employee_id") REFERENCES "vpg_employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_deductions_per_employee" ADD CONSTRAINT "fk_vpg_deductions_per_employee_deductions_23" FOREIGN KEY ("deductions_per_employee_deduction_id") REFERENCES "vpg_deductions"("deductions_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vpg_deductions_per_employee" ADD CONSTRAINT "fk_vpg_deductions_per_employee_employees_22" FOREIGN KEY ("deductions_per_employee_employee_id") REFERENCES "vpg_employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

