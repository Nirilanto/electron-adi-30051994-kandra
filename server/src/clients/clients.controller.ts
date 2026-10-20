import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { parseListQuery } from '../common/utils/query';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.clients.findAll(parseListQuery(query));
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clients.findOne(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.clients.create(body);
  }

  @Put(':id')
  replace(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    return this.clients.update(id, body);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    return this.clients.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clients.remove(id);
  }
}
