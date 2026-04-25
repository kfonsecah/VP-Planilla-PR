-- CreateTable
CREATE TABLE "vpg_clock_aliases" (
    "aliases_id" SERIAL NOT NULL,
    "aliases_employee_id" INTEGER NOT NULL,
    "aliases_name" VARCHAR(100) NOT NULL,
    "aliases_created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aliases_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_clock_aliases_pkey" PRIMARY KEY ("aliases_id")
);

-- CreateIndex
CREATE INDEX "idx_vpg_clock_aliases_employee_id" ON "vpg_clock_aliases"("aliases_employee_id");

-- CreateIndex
CREATE INDEX "idx_vpg_clock_aliases_name" ON "vpg_clock_aliases"("aliases_name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_vpg_clock_aliases_emp_name" ON "vpg_clock_aliases"("aliases_employee_id", "aliases_name");

-- AddForeignKey
ALTER TABLE "vpg_clock_aliases" ADD CONSTRAINT "fk_vpg_clock_aliases_employees_33" FOREIGN KEY ("aliases_employee_id") REFERENCES "vpg_employees"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
