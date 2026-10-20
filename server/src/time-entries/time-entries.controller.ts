import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';
import { parseListQuery } from '../common/utils/query';

@Controller('time-entries')
export class TimeEntriesController {
  constructor(private readonly entries: TimeEntriesService) {}

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.entries.findAll(parseListQuery(query));
  }

  @Get('lookup')
  lookup(
    @Query('employeeId') employeeId: string,
    @Query('contractId') contractId: string,
    @Query('date') date: string,
  ) {
    return this.entries.lookup(employeeId, contractId, date);
  }

  @HttpCode(200)
  @Post('import')
  importEntries(@Body() body: { timeEntries?: unknown }) {
    return this.entries.importEntries(body?.timeEntries);
  }

  @HttpCode(200)
  @Post('cleanup')
  cleanup() {
    return this.entries.cleanup();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.entries.findOne(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.entries.create(body);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() body: unknown) {
    return this.entries.update(id, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.entries.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.entries.remove(id);
  }
}
