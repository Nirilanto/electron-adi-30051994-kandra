import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { KvService } from './kv.service';

@Controller('kv')
export class KvController {
  constructor(private readonly kv: KvService) {}

  @Get()
  async keys() {
    return { keys: await this.kv.keys() };
  }

  @Get(':key')
  async get(@Param('key') key: string) {
    return { key, value: await this.kv.get(key) };
  }

  @Put(':key')
  async set(@Param('key') key: string, @Body() body: { value?: unknown }) {
    await this.kv.set(key, body?.value ?? null);
    return { success: true };
  }

  @Delete(':key')
  async remove(@Param('key') key: string) {
    await this.kv.remove(key);
    return { success: true };
  }
}
