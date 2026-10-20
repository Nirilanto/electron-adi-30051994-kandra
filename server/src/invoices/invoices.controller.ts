import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { parseListQuery } from '../common/utils/query';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.invoices.findAll(parseListQuery(query));
  }

  @Get('statistics')
  statistics() {
    return this.invoices.statistics();
  }

  @HttpCode(200)
  @Post('next-number')
  nextNumber() {
    return this.invoices.nextNumber();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.invoices.findOne(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.invoices.create(body);
  }

  @Put(':id')
  replace(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    return this.invoices.update(id, body);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    return this.invoices.update(id, body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: string }) {
    return this.invoices.updateStatus(id, body.status);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.invoices.remove(id);
  }
}
