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

-- === END OF SEQUENCES === --
-- === TABLES === --
-- === Enterprise Structure === --
CREATE TABLE
    VPG_ENTERPRISE (
        id integer primary key,
        name varchar(50) not null,
        image bytea not null,
        creation_date date not null,
        version integer default 1 not null,
    );

CREATE TABLE
    VPG_BRANCHES (
        id integer primary key,
        branch_name varchar(50) not null,
        location varchar(100) not null,
        version integer default 1 not null
    );

CREATE TABLE
    VPG_ENTERPRISE_BRANCH (enterprise_id INTEGER, branch_id INTEGER);

CREATE TABLE
    VPG_BRANCH_EMPLOYEE (branch_id INTEGER, employee_id INTEGER);

CREATE TABLE
    vpg_positions (
        id integer primary key default nextval ('seq_vpg_positions_03'),
        name varchar(50) not null,
        description text not null,
        base_salary decimal(10, 2) not null,
        version integer default 1 not null
    );

-- === Employee Management === --
CREATE TABLE
    vpg_employees (
        id integer primary key default nextval ('seq_vpg_employees_04'),
        first_name varchar(50) not null,
        last_name varchar(50) not null,
        middle_name varchar(50) not null,
        national_id varchar(30) not null,
        email varchar(100) not null,
        position_id integer not null,
        hire_date date not null,
        status char(1) not null check (status in ('A', 'I', 'T')),
        version integer default 1 not null
    );

CREATE TABLE
    vpg_employee_documents (
        id integer primary key default nextval ('seq_vpg_employee_documents_17'),
        employee_id integer not null,
        file_path varchar(255) not null,
        document_type varchar(50) not null,
        uploaded_at timestamp not null
    );

-- === Payroll and Deductions Management === --
CREATE TABLE
    vpg_payroll_types (
        id integer primary key default nextval ('seq_vpg_payroll_types_05'),
        name varchar(50) not null,
        description text not null,
        version integer default 1 not null
    );

CREATE TABLE
    vpg_payrolls (
        id integer primary key default nextval ('seq_vpg_payrolls_06'),
        payroll_type_id integer not null,
        period_start date not null,
        period_end date not null,
        payment_date date not null,
        status varchar(20) not null,
        version integer default 1 not null
    );

CREATE TABLE
    vpg_payroll_employee (
        payroll_id integer not null default nextval ('seq_vpg_payrolls_employee_18'),
        employee_id integer not null,
        gross_salary decimal(10, 2) not null,
        total_deductions decimal(10, 2) not null,
        net_salary decimal(10, 2) not null,
        version integer default 1 not null
    );

CREATE TABLE
    vpg_deductions (
        id integer primary key default nextval ('seq_vpg_deductions_07'),
        name varchar(100) not null,
        description text not null,
        percentage decimal(5, 2),
        fixed_amount decimal(10, 2),
        version integer default 1 not null
    );

CREATE TABLE
    vpg_employee_deduction (
        employee_id integer not null,
        deduction_id integer not null
    );

CREATE TABLE
    vpg_bonuses (
        id integer primary key default nextval ('seq_vpg_bonuses_08'),
        employee_id integer not null,
        description varchar(255) not null,
        amount decimal(10, 2) not null,
        granted_at date not null
    );

-- === Users and Access Control === --
CREATE TABLE
    vpg_users (
        id integer primary key default nextval ('seq_vpg_users_09'),
        first_name varchar(50) not null,
        last_name varchar(50) not null,
        middle_name varchar(50) not null,
        national_id varchar(30) not null,
        email varchar(100) not null,
        username varchar(50) not null,
        password varchar(255) not null,
        role varchar(20) not null,
        version integer default 1 not null
    );

CREATE TABLE
    vpg_audit_logs (
        id integer primary key default nextval ('seq_vpg_audit_logs_10'),
        user_id integer not null,
        action varchar(100) not null,
        entity varchar(100) not null,
        entity_id integer not null,
        timestamp timestamp not null,
        details text
    );

-- === Clock/Attendance Management === --
CREATE TABLE
    vpg_clock_logs (
        id integer primary key default nextval ('seq_vpg_clock_logs_11'),
        employee_id integer not null,
        timestamp timestamp not null,
        log_type varchar(10) not null,
        remarks text,
        version integer default 1 not null
    );

-- === Labor Events Management === --
CREATE TABLE
    vpg_labor_events (
        id integer primary key default nextval ('seq_vpg_labor_events_12'),
        name varchar(100) not null,
        description text not null,
        version integer default 1 not null
    );

CREATE TABLE
    vpg_employee_labor_event (
        id integer primary key default nextval ('seq_vpg_employee_labor_event_19'),
        employee_id integer not null,
        labor_event_id integer not null,
        start_date date not null,
        end_date date,
        status varchar(20) not null,
        version integer default 1 not null
    );

-- === Report Management === --
CREATE TABLE
    vpg_report_logs (
        id integer primary key default nextval ('seq_vpg_report_logs_14'),
        report_type varchar(50) not null,
        generated_by integer not null,
        generated_at timestamp not null,
        period_start date not null,
        period_end date not null,
        file_path varchar(255) not null,
        status varchar(20) not null,
        version integer default 1 not null
    );

CREATE TABLE
    vpg_report_versions (
        id integer primary key default nextval ('seq_vpg_report_versions_15'),
        report_log_id integer not null,
        created_at timestamp not null,
        file_path varchar(255) not null,
        remarks text
    );

CREATE TABLE
    vpg_report_targets (
        id integer primary key default nextval ('seq_vpg_report_targets_16'),
        institution varchar(100) not null,
        endpoint_url varchar(255) not null,
        auth_token varchar(255) not null,
        contact_email varchar(100) not null,
        version integer default 1 not null
    );

-- === Mail Server Settings === --
CREATE TABLE vpg_mail_server_settings (
    id integer primary key default nextval('seq_vpg_mail_server_settings_17'),
    host varchar(100) not null,
    port integer not null,
    username varchar(100) not null,
    password varchar(255) not null,
    from_address varchar(100) not null,
    use_ssl boolean not null,
    use_tls boolean not null,
    version integer default 1 not null
);

-- === END OF TABLES === --

-- === Relationships === --

alter table vpg_enterprise_branch
add constraint fk_vpg_enterprise_branch_enterprise_01
foreign key (enterprise_id)
references vpg_enterprise(id);

alter table vpg_enterprise_branch
add constraint fk_vpg_enterprise_branch_branches_02
foreign key (branch_id)
references vpg_branches(id);

alter table vpg_branch_employee
add constraint fk_vpg_branch_employee_branches_03
foreign key (branch_id)
references vpg_branches(id);

alter table vpg_branch_employee
add constraint fk_vpg_branch_employee_employees_04
foreign key (employee_id)
references vpg_employees(id);

alter table vpg_employees
add constraint fk_vpg_employees_positions_05
foreign key (position_id)
references vpg_positions(id);

alter table vpg_payrolls
add constraint fk_vpg_payrolls_payroll_types_06
foreign key (payroll_type_id)
references vpg_payroll_types(id);

alter table vpg_payroll_employee
add constraint fk_vpg_payroll_employee_payrolls_07
foreign key (payroll_id)
references vpg_payrolls(id);

alter table vpg_payroll_employee
add constraint fk_vpg_payroll_employee_employees_08
foreign key (employee_id)
references vpg_employees(id);

alter table vpg_employee_deduction
add constraint fk_vpg_employee_deduction_employees_09
foreign key (employee_id)
references vpg_employees(id);

alter table vpg_employee_deduction
add constraint fk_vpg_employee_deduction_deductions_10
foreign key (deduction_id)
references vpg_deductions(id);

alter table vpg_clock_logs
add constraint fk_vpg_clock_logs_employees_11
foreign key (employee_id)
references vpg_employees(id);

alter table vpg_report_logs
add constraint fk_vpg_report_logs_users_12
foreign key (generated_by)
references vpg_users(id);

alter table vpg_report_versions
add constraint fk_vpg_report_versions_report_logs_13
foreign key (report_log_id)
references vpg_report_logs(id);

alter table vpg_audit_logs
add constraint fk_vpg_audit_logs_users_14
foreign key (user_id)
references vpg_users(id);

alter table vpg_bonuses
add constraint fk_vpg_bonuses_employees_15
foreign key (employee_id)
references vpg_employees(id);

alter table vpg_employee_documents
add constraint fk_vpg_employee_documents_employees_16
foreign key (employee_id)
references vpg_employees(id);

alter table vpg_employee_labor_event
add constraint fk_vpg_employee_labor_event_employees_17
foreign key (employee_id)
references vpg_employees(id);

alter table vpg_employee_labor_event
add constraint fk_vpg_employee_labor_event_labor_events_18
foreign key (labor_event_id)
references vpg_labor_events(id);

-- === END OF RELATIONSHIPS === --
-- === Indexes === --
create index idx_vpg_enterprise_branch_enterprise_id
on vpg_enterprise_branch(enterprise_id);

create index idx_vpg_enterprise_branch_branch_id
on vpg_enterprise_branch(branch_id);

create index idx_vpg_branch_employee_branch_id
on vpg_branch_employee(branch_id);

create index idx_vpg_branch_employee_employee_id
on vpg_branch_employee(employee_id);

create index idx_vpg_employees_position_id
on vpg_employees(position_id);

create index idx_vpg_payrolls_payroll_type_id
on vpg_payrolls(payroll_type_id);

create index idx_vpg_payroll_employee_payroll_id
on vpg_payroll_employee(payroll_id);

create index idx_vpg_payroll_employee_employee_id
on vpg_payroll_employee(employee_id);

create index idx_vpg_employee_deduction_employee_id
on vpg_employee_deduction(employee_id);

create index idx_vpg_employee_deduction_deduction_id
on vpg_employee_deduction(deduction_id);

create index idx_vpg_clock_logs_employee_id
on vpg_clock_logs(employee_id);

create index idx_vpg_report_logs_generated_by
on vpg_report_logs(generated_by);

create index idx_vpg_report_versions_report_log_id
on vpg_report_versions(report_log_id);

create index idx_vpg_audit_logs_user_id
on vpg_audit_logs(user_id);

create index idx_vpg_bonuses_employee_id
on vpg_bonuses(employee_id);

create index idx_vpg_employee_documents_employee_id
on vpg_employee_documents(employee_id);

create index idx_vpg_employee_labor_event_employee_id
on vpg_employee_labor_event(employee_id);

create index idx_vpg_employee_labor_event_labor_event_id
on vpg_employee_labor_event(labor_event_id);
-- === END OF INDEXES === --
-- === End of Script === --
