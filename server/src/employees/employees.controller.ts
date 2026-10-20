import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { parseListQuery } from '../common/utils/query';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.employees.findAll(parseListQuery(query));
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employees.findOne(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.employees.create(body);
  }

  @Put(':id')
  replace(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    return this.employees.update(id, body);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    return this.employees.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employees.remove(id);
  }
}
