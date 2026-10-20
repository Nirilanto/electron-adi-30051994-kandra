import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CountersService } from '../counters/counters.service';
import { parseListQuery } from '../common/utils/query';

@Controller('contracts')
export class ContractsController {
  constructor(
    private readonly contracts: ContractsService,
    private readonly counters: CountersService,
  ) {}

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.contracts.findAll(parseListQuery(query));
  }

  @HttpCode(200)
  @Post('next-number')
  async nextNumber() {
    return { contractNumber: await this.counters.nextContractNumber() };
  }

  @HttpCode(200)
  @Post('cleanup')
  cleanup() {
    return this.contracts.cleanup();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contracts.findOne(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.contracts.create(body);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() body: unknown) {
    return this.contracts.replace(id, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.contracts.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contracts.remove(id);
  }
}
