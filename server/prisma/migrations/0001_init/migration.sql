-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "employee_number" TEXT,
    "qualification" TEXT,
    "nationality" TEXT,
    "hourly_rate" DOUBLE PRECISION,
    "social_security_number" TEXT,
    "hire_date" TEXT,
    "departure_date" TEXT,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "company_name" TEXT,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "siret" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "client_number" TEXT,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "contract_number" INTEGER,
    "title" TEXT,
    "employee_id" INTEGER,
    "client_id" INTEGER,
    "start_date" TEXT,
    "end_date" TEXT,
    "location" TEXT,
    "hourly_rate" DOUBLE PRECISION,
    "billing_rate" DOUBLE PRECISION,
    "signature_id" INTEGER,
    "stamp_id" INTEGER,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" TEXT NOT NULL,
    "employee_id" INTEGER,
    "contract_id" TEXT,
    "client_id" INTEGER,
    "date" VARCHAR(10) NOT NULL,
    "total_hours" DOUBLE PRECISION,
    "normal_hours" DOUBLE PRECISION,
    "overtime_hours" DOUBLE PRECISION,
    "hourly_rate" DOUBLE PRECISION,
    "billing_rate" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "work_type" TEXT,
    "invoice_id" INTEGER,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "invoice_number" TEXT,
    "client_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "invoice_date" TEXT,
    "due_date" TEXT,
    "period_start" TEXT,
    "period_end" TEXT,
    "total_amount" DOUBLE PRECISION,
    "is_finalized" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER,
    "period_start" TEXT,
    "period_end" TEXT,
    "payment_date" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_items" (
    "kind" TEXT NOT NULL,
    "id" INTEGER NOT NULL,
    "title" TEXT,
    "label" TEXT,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_items_pkey" PRIMARY KEY ("kind","id")
);

-- CreateTable
CREATE TABLE "signatures" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "type" TEXT,
    "image_data" TEXT,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counters" (
    "name" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "counters_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "kv_store" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kv_store_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "employees_last_name_first_name_idx" ON "employees"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "clients_company_name_idx" ON "clients"("company_name");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "contracts_contract_number_idx" ON "contracts"("contract_number");

-- CreateIndex
CREATE INDEX "contracts_employee_id_idx" ON "contracts"("employee_id");

-- CreateIndex
CREATE INDEX "contracts_client_id_idx" ON "contracts"("client_id");

-- CreateIndex
CREATE INDEX "contracts_start_date_end_date_idx" ON "contracts"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "time_entries_date_idx" ON "time_entries"("date");

-- CreateIndex
CREATE INDEX "time_entries_status_idx" ON "time_entries"("status");

-- CreateIndex
CREATE INDEX "time_entries_contract_id_idx" ON "time_entries"("contract_id");

-- CreateIndex
CREATE INDEX "time_entries_client_id_idx" ON "time_entries"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "time_entries_employee_id_contract_id_date_key" ON "time_entries"("employee_id", "contract_id", "date");

-- CreateIndex
CREATE INDEX "invoices_invoice_number_idx" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_client_id_idx" ON "invoices"("client_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_invoice_date_idx" ON "invoices"("invoice_date");

-- CreateIndex
CREATE INDEX "payslips_employee_id_period_end_idx" ON "payslips"("employee_id", "period_end");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

