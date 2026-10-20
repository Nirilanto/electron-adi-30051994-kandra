import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { CountersModule } from './counters/counters.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmployeesModule } from './employees/employees.module';
import { ClientsModule } from './clients/clients.module';
import { ContractsModule } from './contracts/contracts.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PayslipsModule } from './payslips/payslips.module';
import { SettingsModule } from './settings/settings.module';
import { KvModule } from './kv/kv.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BackupModule } from './backup/backup.module';
import { PdfModule } from './pdf/pdf.module';
import { HealthController } from './health.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CountersModule,
    AuthModule,
    UsersModule,
    EmployeesModule,
    ClientsModule,
    ContractsModule,
    TimeEntriesModule,
    InvoicesModule,
    PayslipsModule,
    SettingsModule,
    KvModule,
    DashboardModule,
    BackupModule,
    PdfModule,
  ],
  controllers: [HealthController],
  providers: [
    // Toutes les routes exigent un jeton valide, sauf celles marquées @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
