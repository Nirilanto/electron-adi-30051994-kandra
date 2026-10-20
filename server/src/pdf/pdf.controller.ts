import { BadRequestException, Body, Controller, HttpCode, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { PdfService, PDF_TYPES } from './pdf.service';

interface PdfRequest {
  data?: Record<string, any>;
  filename?: string;
}

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdf: PdfService) {}

  @HttpCode(200)
  @Post(':type')
  async generate(@Param('type') type: string, @Body() body: PdfRequest, @Res() res: Response) {
    if (!PDF_TYPES.includes(type)) {
      throw new BadRequestException(`Type de document inconnu : ${type}`);
    }
    const buffer = await this.pdf.generate(type, body?.data || {});
    const safeName = String(body?.filename || `${type}.pdf`).replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    res.setHeader('Content-Length', String(buffer.length));
    res.end(buffer);
  }
}
