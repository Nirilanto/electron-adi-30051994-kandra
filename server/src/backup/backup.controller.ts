import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { BackupService } from './backup.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('backup')
export class BackupController {
  constructor(private readonly backup: BackupService) {}

  @Get('export')
  exportAll() {
    return this.backup.exportAll();
  }

  /** La restauration remplace toutes les données : réservée aux administrateurs. */
  @Roles('admin')
  @HttpCode(200)
  @Post('import')
  importAll(@Body() body: unknown) {
    return this.backup.importAll(body);
  }
}
