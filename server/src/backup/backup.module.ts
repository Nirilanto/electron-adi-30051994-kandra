import { Module } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { EmployeesModule } from '../employees/employees.module';
import { ClientsModule } from '../clients/clients.module';
import { ContractsModule } from '../contracts/contracts.module';
import { TimeEntriesModule } from '../time-entries/time-entries.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { PayslipsModule } from '../payslips/payslips.module';
import { SettingsModule } from '../settings/settings.module';
import { KvModule } from '../kv/kv.module';

@Module({
  imports: [
    EmployeesModule,
    ClientsModule,
    ContractsModule,
    TimeEntriesModule,
    InvoicesModule,
    PayslipsModule,
    SettingsModule,
    KvModule,
  ],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
