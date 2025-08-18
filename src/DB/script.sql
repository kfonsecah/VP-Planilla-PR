-- VP Planillas Database Schema --
-- === SEQUENCES === --
-- This script creates sequences for various tables in the VP Planillas database.
CREATE SEQUENCE seq_vpg_enterprise_01 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_branches_02 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_positions_03 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_employees_04 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_payroll_types_05 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_payrolls_06 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_deductions_07 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_bonuses_08 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_users_09 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_audit_logs_10 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_clock_logs_11 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_labor_events_12 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_report_logs_13 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_report_versions_14 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_report_targets_15 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_mail_server_settings_16 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_employee_documents_17 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_payrolls_employee_18 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_employee_labor_event_19 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE SEQUENCE seq_vpg_vacations_20 START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

-- === END OF SEQUENCES === --
-- === TABLES === --
-- === Enterprise Structure === --
CREATE TABLE
    VPG_ENTERPRISE (
        enterprise_id integer primary key default nextval('seq_vpg_enterprise_01'),
        enterprise_name varchar(50) not null,
        enterprise_image bytea not null,
        enterprise_creation_date date not null,
        enterpise_version integer default 1 not null
    );

CREATE TABLE
    VPG_BRANCHES (
        branch_id integer primary key default nextval('seq_vpg_branches_02'),
        branch_name varchar(50) not null,
        branch_location varchar(100) not null,
        branch_version integer default 1 not null
    );

CREATE TABLE
    VPG_ENTERPRISE_BRANCH (branch_enterprise_enterprise_id INTEGER, branch_enterprise_branch_id INTEGER);

CREATE TABLE
    VPG_BRANCH_EMPLOYEE (employee_branch_branch_id INTEGER, employee_branch_employee_id INTEGER);

CREATE TABLE
    vpg_positions (
        position_id integer primary key default nextval ('seq_vpg_positions_03'),
        position_name varchar(50) not null,
        position_description text not null,
        position_base_salary decimal(10, 2) not null,
        position_version integer default 1 not null
    );

-- === Employee Management === --
CREATE TABLE
    vpg_employees (
        employee_id integer primary key default nextval ('seq_vpg_employees_04'),
        employee_first_name varchar(50) not null,
        employee_last_name varchar(50) not null,
        employee_middle_name varchar(50) not null,
        employee_national_id varchar(30) not null,
        employee_social_code varchar(100) not null,
        employee_email varchar(100) not null,
        employee_position_id integer not null,
        employee_hire_date date not null,
        employee_exit_date date,
        employee_fired boolean default false not null,
        employee_status char(1) not null check (employee_status in ('A', 'I', 'T')),
        employee_version integer default 1 not null
    );

CREATE TABLE
    vpg_employee_documents (
        employee_documents_id integer primary key default nextval ('seq_vpg_employee_documents_17'),
        employee_documents_employee_id integer not null,
        employee_documents_file_path varchar(255) not null,
        employee_documents_document_type varchar(50) not null,
        employee_documents_uploaded_at timestamp not null
    );

-- === Payroll and Deductions Management === --
CREATE TABLE
    vpg_payroll_types (
        payroll_types_id integer primary key default nextval ('seq_vpg_payroll_types_05'),
        payroll_types_name varchar(50) not null,
        payroll_types_description text not null,
        payroll_types_version integer default 1 not null
    );

CREATE TABLE
    vpg_payrolls (
        payrolls_id integer primary key default nextval ('seq_vpg_payrolls_06'),
        payrolls_payroll_type_id integer not null,
        payrolls_period_start date not null,
        payrolls_period_end date not null,
        payrolls_payment_date date not null,
        payrolls_status varchar(20) not null,
        payrolls_version integer default 1 not null
    );

CREATE TABLE
    vpg_payroll_employee (
        payroll_employee_id integer primary key default nextval ('seq_vpg_payrolls_employee_18'),
        payroll_employee_payroll_id integer not null,
        payroll_employee_employee_id integer not null,
        payroll_employee_gross_salary decimal(10, 2) not null,
        payroll_employee_total_deductions decimal(10, 2) not null,
        payroll_employee_net_salary decimal(10, 2) not null,
        payroll_employee_version integer default 1 not null
    );

CREATE TABLE
    vpg_deductions (
        deductions_id integer primary key default nextval ('seq_vpg_deductions_07'),
        deductions_name varchar(100) not null,
        deductions_description text not null,
        deductions_percentage decimal(5, 2),
        deductions_fixed_amount decimal(10, 2),
        deductions_version integer default 1 not null
    );

CREATE TABLE
    vpg_vacations (
        vacations_id INTEGER PRIMARY KEY DEFAULT nextval ('seq_vpg_vacations_20'),
        vacations_employee_id INTEGER NOT NULL,
        vacations_start_date DATE NOT NULL,
        vacations_end_date DATE NOT NULL,
        vacations_total_days INTEGER GENERATED ALWAYS AS (vacations_end_date - vacations_start_date + 1) STORED,
        vacations_paid BOOLEAN DEFAULT TRUE,
        vacations_status VARCHAR(20) DEFAULT 'Aprobado', -- Pendiente, Aprobado, Rechazado
        vacations_version INTEGER DEFAULT 1 NOT NULL
    );

CREATE TABLE
    vpg_employee_deductions (
        employee_deductions_employee_id INTEGER NOT NULL,
        employee_deductions_deduction_id INTEGER NOT NULL,
        employee_deductions_payroll_id INTEGER NOT NULL, -- A cuál planilla pertenece esta deducción
        employee_deductions_year INTEGER NOT NULL, -- Año fiscal
        employee_deductions_month INTEGER NOT NULL, -- Mes de la deducción
        employee_deductions_amount DECIMAL(10, 2) NOT NULL, -- Monto aplicado al empleado en esta planilla
        employee_deductions_version INTEGER DEFAULT 1 NOT NULL,
        PRIMARY KEY (employee_deductions_employee_id, employee_deductions_deduction_id, employee_deductions_payroll_id)
    );

CREATE TABLE
    vpg_bonuses (
        bonuses_id INTEGER PRIMARY KEY DEFAULT nextval ('seq_vpg_bonuses_08'),
        bonuses_employee_id INTEGER NOT NULL,
        bonuses_payroll_id INTEGER NOT NULL, -- Planilla en la que se pagó el bono
        bonuses_year INTEGER NOT NULL, -- Año contable
        bonuses_month INTEGER NOT NULL, -- Mes contable
        bonuses_description VARCHAR(255) NOT NULL,
        bonuses_amount DECIMAL(10, 2) NOT NULL,
        bonuses_granted_at DATE NOT NULL, -- Fecha en que se concedió
        bonuses_version INTEGER DEFAULT 1 NOT NULL
    );

-- === Users and Access Control === --
CREATE TABLE
    vpg_users (
        user_id integer primary key default nextval ('seq_vpg_users_09'),
        user_first_name varchar(50) not null,
        user_last_name varchar(50) not null,
        user_middle_name varchar(50) not null,
        user_national_id varchar(30) not null,
        user_email varchar(100) not null,
        user_username varchar(50) not null,
        user_password varchar(255) not null,
        user_role varchar(20) not null,
        user_version integer default 1 not null
    );

CREATE TABLE
    vpg_audit_logs (
        audit_logs_id integer primary key default nextval ('seq_vpg_audit_logs_10'),
        audit_logs_user_id integer not null,
        audit_logs_action varchar(100) not null,
        audit_logs_entity varchar(100) not null,
        audit_logs_entity_id integer not null,
        audit_logs_timestamp timestamp not null,
        audit_logs_details text
    );

-- === Clock/Attendance Management === --
CREATE TABLE
    vpg_clock_logs (
        clock_logs_id integer primary key default nextval ('seq_vpg_clock_logs_11'),
        clock_logs_employee_id integer not null,
        clock_logs_timestamp timestamp not null,
        clock_logs_log_type varchar(10) not null,
        clock_logs_remarks text,
        clock_logs_version integer default 1 not null
    );

-- === Labor Events Management === --
CREATE TABLE
    vpg_labor_events (
        labor_events_id integer primary key default nextval ('seq_vpg_labor_events_12'),
        labor_events_name varchar(100) not null,
        labor_events_description text not null,
        labor_events_version integer default 1 not null
    );

CREATE TABLE
    vpg_employee_labor_event (
        employee_labor_event_id integer primary key default nextval ('seq_vpg_employee_labor_event_19'),
        employee_labor_event_employee_id integer not null,
        employee_labor_event_labor_event_id integer not null,
        employee_labor_event_start_date date not null,
        employee_labor_event_end_date date,
        employee_labor_event_status varchar(20) not null,
        employee_labor_event_version integer default 1 not null
    );

-- === Report Management === --
CREATE TABLE
    vpg_report_logs (
        report_logs_id integer primary key default nextval ('seq_vpg_report_logs_13'),
        report_logs_report_type varchar(50) not null,
        report_logs_generated_by integer not null,
        report_logs_generated_at timestamp not null,
        report_logs_period_start date not null,
        report_logs_period_end date not null,
        report_logs_file_path varchar(255) not null,
        report_logs_status varchar(20) not null,
        report_logs_version integer default 1 not null
    );

CREATE TABLE
    vpg_report_versions (
        report_versions_id integer primary key default nextval ('seq_vpg_report_versions_14'),
        report_versions_report_log_id integer not null,
        report_versions_created_at timestamp not null,
        report_versions_file_path varchar(255) not null,
        report_versions_remarks text
    );

CREATE TABLE
    vpg_report_targets (
        report_targets_id integer primary key default nextval ('seq_vpg_report_targets_15'),
        report_targets_institution varchar(100) not null,
        report_targets_endpoint_url varchar(255) not null,
        report_targets_auth_token varchar(255) not null,
        report_targets_contact_email varchar(100) not null,
        report_targets_version integer default 1 not null
    );

-- === Mail Server Settings === --
CREATE TABLE
    vpg_mail_server_settings (
        mail_server_settings_id integer primary key default nextval ('seq_vpg_mail_server_settings_16'),
        mail_server_settings_host varchar(100) not null,
        mail_server_settings_port integer not null,
        mail_server_settings_username varchar(100) not null,
        mail_server_settings_password varchar(255) not null,
        mail_server_settings_from_address varchar(100) not null,
        mail_server_settings_use_ssl boolean not null,
        mail_server_settings_use_tls boolean not null,
        mail_server_settings_version integer default 1 not null
    );

-- === END OF TABLES === --
-- === Relationships === --
-- Enterprise and Branch relationships
alter table VPG_ENTERPRISE_BRANCH add constraint fk_vpg_enterprise_branch_enterprise_01 foreign key (branch_enterprise_enterprise_id) references VPG_ENTERPRISE (enterprise_id);

alter table VPG_ENTERPRISE_BRANCH add constraint fk_vpg_enterprise_branch_branches_02 foreign key (branch_enterprise_branch_id) references VPG_BRANCHES (branch_id);

alter table VPG_BRANCH_EMPLOYEE add constraint fk_vpg_branch_employee_branches_03 foreign key (employee_branch_branch_id) references VPG_BRANCHES (branch_id);

alter table VPG_BRANCH_EMPLOYEE add constraint fk_vpg_branch_employee_employees_04 foreign key (employee_branch_employee_id) references vpg_employees (employee_id);

-- Employee relationships
alter table vpg_employees add constraint fk_vpg_employees_positions_05 foreign key (employee_position_id) references vpg_positions (position_id);

alter table vpg_employee_documents add constraint fk_vpg_employee_documents_employees_06 foreign key (employee_documents_employee_id) references vpg_employees (employee_id);

-- Payroll relationships
alter table vpg_payrolls add constraint fk_vpg_payrolls_payroll_types_07 foreign key (payrolls_payroll_type_id) references vpg_payroll_types (payroll_types_id);

alter table vpg_payroll_employee add constraint fk_vpg_payroll_employee_payrolls_08 foreign key (payroll_employee_payroll_id) references vpg_payrolls (payrolls_id);

alter table vpg_payroll_employee add constraint fk_vpg_payroll_employee_employees_09 foreign key (payroll_employee_employee_id) references vpg_employees (employee_id);

-- Deductions relationships
alter table vpg_employee_deductions add constraint fk_vpg_employee_deductions_employees_10 foreign key (employee_deductions_employee_id) references vpg_employees (employee_id);

alter table vpg_employee_deductions add constraint fk_vpg_employee_deductions_deductions_11 foreign key (employee_deductions_deduction_id) references vpg_deductions (deductions_id);

alter table vpg_employee_deductions add constraint fk_vpg_employee_deductions_payrolls_12 foreign key (employee_deductions_payroll_id) references vpg_payrolls (payrolls_id);

-- Bonuses relationships
alter table vpg_bonuses add constraint fk_vpg_bonuses_employees_13 foreign key (bonuses_employee_id) references vpg_employees (employee_id);

alter table vpg_bonuses add constraint fk_vpg_bonuses_payrolls_14 foreign key (bonuses_payroll_id) references vpg_payrolls (payrolls_id);

-- Vacations relationships
alter table vpg_vacations add constraint fk_vpg_vacations_employees_15 foreign key (vacations_employee_id) references vpg_employees (employee_id);

-- Clock logs relationships
alter table vpg_clock_logs add constraint fk_vpg_clock_logs_employees_16 foreign key (clock_logs_employee_id) references vpg_employees (employee_id);

-- Labor events relationships
alter table vpg_employee_labor_event add constraint fk_vpg_employee_labor_event_employees_17 foreign key (employee_labor_event_employee_id) references vpg_employees (employee_id);

alter table vpg_employee_labor_event add constraint fk_vpg_employee_labor_event_labor_events_18 foreign key (employee_labor_event_labor_event_id) references vpg_labor_events (labor_events_id);

-- Report relationships
alter table vpg_report_logs add constraint fk_vpg_report_logs_users_19 foreign key (report_logs_generated_by) references vpg_users (user_id);

alter table vpg_report_versions add constraint fk_vpg_report_versions_report_logs_20 foreign key (report_versions_report_log_id) references vpg_report_logs (report_logs_id);

-- Audit logs relationships
alter table vpg_audit_logs add constraint fk_vpg_audit_logs_users_21 foreign key (audit_logs_user_id) references vpg_users (user_id);

-- === END OF RELATIONSHIPS === --
-- === Indexes === --
-- Enterprise and Branch indexes
create index idx_vpg_enterprise_branch_enterprise_id on VPG_ENTERPRISE_BRANCH (branch_enterprise_enterprise_id);

create index idx_vpg_enterprise_branch_branch_id on VPG_ENTERPRISE_BRANCH (branch_enterprise_branch_id);

create index idx_vpg_branch_employee_branch_id on VPG_BRANCH_EMPLOYEE (employee_branch_branch_id);

create index idx_vpg_branch_employee_employee_id on VPG_BRANCH_EMPLOYEE (employee_branch_employee_id);

-- Employee indexes
create index idx_vpg_employees_position_id on vpg_employees (employee_position_id);

create index idx_vpg_employees_national_id on vpg_employees (employee_national_id);

create index idx_vpg_employees_email on vpg_employees (employee_email);

create index idx_vpg_employees_status on vpg_employees (employee_status);

create index idx_vpg_employee_documents_employee_id on vpg_employee_documents (employee_documents_employee_id);

create index idx_vpg_employee_documents_type on vpg_employee_documents (employee_documents_document_type);

-- Payroll indexes
create index idx_vpg_payrolls_payroll_type_id on vpg_payrolls (payrolls_payroll_type_id);

create index idx_vpg_payrolls_period_start on vpg_payrolls (payrolls_period_start);

create index idx_vpg_payrolls_period_end on vpg_payrolls (payrolls_period_end);

create index idx_vpg_payrolls_status on vpg_payrolls (payrolls_status);

create index idx_vpg_payroll_employee_payroll_id on vpg_payroll_employee (payroll_employee_payroll_id);

create index idx_vpg_payroll_employee_employee_id on vpg_payroll_employee (payroll_employee_employee_id);

create index idx_vpg_payroll_employee_composite on vpg_payroll_employee (payroll_employee_payroll_id, payroll_employee_employee_id);

-- Deductions indexes
create index idx_vpg_employee_deductions_employee_id on vpg_employee_deductions (employee_deductions_employee_id);

create index idx_vpg_employee_deductions_deduction_id on vpg_employee_deductions (employee_deductions_deduction_id);

create index idx_vpg_employee_deductions_payroll_id on vpg_employee_deductions (employee_deductions_payroll_id);

create index idx_vpg_employee_deductions_year_month on vpg_employee_deductions (employee_deductions_year, employee_deductions_month);

-- Bonuses indexes
create index idx_vpg_bonuses_employee_id on vpg_bonuses (bonuses_employee_id);

create index idx_vpg_bonuses_payroll_id on vpg_bonuses (bonuses_payroll_id);

create index idx_vpg_bonuses_year_month on vpg_bonuses (bonuses_year, bonuses_month);

create index idx_vpg_bonuses_granted_at on vpg_bonuses (bonuses_granted_at);

-- Vacations indexes
create index idx_vpg_vacations_employee_id on vpg_vacations (vacations_employee_id);

create index idx_vpg_vacations_start_date on vpg_vacations (vacations_start_date);

create index idx_vpg_vacations_end_date on vpg_vacations (vacations_end_date);

create index idx_vpg_vacations_status on vpg_vacations (vacations_status);

-- Clock logs indexes
create index idx_vpg_clock_logs_employee_id on vpg_clock_logs (clock_logs_employee_id);

create index idx_vpg_clock_logs_timestamp on vpg_clock_logs (clock_logs_timestamp);

create index idx_vpg_clock_logs_log_type on vpg_clock_logs (clock_logs_log_type);

-- Labor events indexes
create index idx_vpg_employee_labor_event_employee_id on vpg_employee_labor_event (employee_labor_event_employee_id);

create index idx_vpg_employee_labor_event_labor_event_id on vpg_employee_labor_event (employee_labor_event_labor_event_id);

create index idx_vpg_employee_labor_event_start_date on vpg_employee_labor_event (employee_labor_event_start_date);

create index idx_vpg_employee_labor_event_status on vpg_employee_labor_event (employee_labor_event_status);

-- Users indexes
create index idx_vpg_users_username on vpg_users (user_username);

create index idx_vpg_users_email on vpg_users (user_email);

create index idx_vpg_users_national_id on vpg_users (user_national_id);

create index idx_vpg_users_role on vpg_users (user_role);

-- Report indexes
create index idx_vpg_report_logs_generated_by on vpg_report_logs (report_logs_generated_by);

create index idx_vpg_report_logs_report_type on vpg_report_logs (report_logs_report_type);

create index idx_vpg_report_logs_generated_at on vpg_report_logs (report_logs_generated_at);

create index idx_vpg_report_logs_status on vpg_report_logs (report_logs_status);

create index idx_vpg_report_versions_report_log_id on vpg_report_versions (report_versions_report_log_id);

create index idx_vpg_report_versions_created_at on vpg_report_versions (report_versions_created_at);

-- Audit logs indexes
create index idx_vpg_audit_logs_user_id on vpg_audit_logs (audit_logs_user_id);

create index idx_vpg_audit_logs_action on vpg_audit_logs (audit_logs_action);

create index idx_vpg_audit_logs_entity on vpg_audit_logs (audit_logs_entity);

create index idx_vpg_audit_logs_timestamp on vpg_audit_logs (audit_logs_timestamp);

-- === END OF INDEXES === --
-- === End of Script === --