import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('company')
  getCompany() {
    return this.settings.getCompany();
  }

  @Put('company')
  async saveCompany(@Body() body: unknown) {
    await this.settings.saveCompany(body);
    return { success: true };
  }

  @Get('lists')
  getAllLists() {
    return this.settings.getAllLists();
  }

  @Get('lists/:kind')
  getList(@Param('kind') kind: string) {
    this.settings.assertKind(kind);
    return this.settings.getList(kind);
  }

  @Post('lists/:kind')
  saveItem(@Param('kind') kind: string, @Body() body: unknown) {
    this.settings.assertKind(kind);
    return this.settings.saveItem(kind, body);
  }

  @Put('lists/:kind')
  async replaceList(@Param('kind') kind: string, @Body() body: unknown) {
    this.settings.assertKind(kind);
    await this.settings.replaceList(kind, body);
    return { success: true };
  }

  @Delete('lists/:kind/:id')
  async deleteItem(@Param('kind') kind: string, @Param('id', ParseIntPipe) id: number) {
    this.settings.assertKind(kind);
    await this.settings.deleteItem(kind, id);
    return { success: true };
  }

  @Get('signatures')
  getSignatures() {
    return this.settings.getSignatures();
  }

  @Post('signatures')
  saveSignature(@Body() body: unknown) {
    return this.settings.saveSignature(body);
  }

  @Delete('signatures/:id')
  async deleteSignature(@Param('id', ParseIntPipe) id: number) {
    await this.settings.deleteSignature(id);
    return { success: true };
  }
}
