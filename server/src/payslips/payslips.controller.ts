import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { PayslipsService } from './payslips.service';
import { parseListQuery } from '../common/utils/query';

@Controller('payslips')
export class PayslipsController {
  constructor(private readonly payslips: PayslipsService) {}

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.payslips.findAll(parseListQuery(query));
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.payslips.findOne(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.payslips.create(body);
  }

  @Put(':id')
  replace(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    return this.payslips.update(id, body);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    return this.payslips.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.payslips.remove(id);
  }
}
