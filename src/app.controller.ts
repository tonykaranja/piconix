import { Controller, Get, Post, Res, Body, Header, HttpException, HttpStatus, RawBodyRequest, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Response, Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getTest(): string {
    return 'hellooo';
  }

  @Get('voice/name')
  async getVoiceName(@Res() res: Response): Promise<void> {
    const mp3 = await this.appService.createVoice();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="antonio.mp3"`);
    res.send(mp3);
  }

  @Post('bias-detection/articles')
  @Header('Content-Type', 'application/json')
  async detectBias(@Body() body: any, @Res() res: Response): Promise<any> {
    const response = await this.appService.detectBiasLlama(body);
    res.status(HttpStatus.OK).send(response);
  }

  @Post('voice/question/formula-one')
  @Header('Content-Type', 'audio/mp3')
  async handleAudioQuestion(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response
  ): Promise<void> {
    if (!req.is('audio/mp3')) {
      throw new HttpException({
        message: 'Content-Type must be audio/mp3'
      }, HttpStatus.BAD_REQUEST);
    }

    if (!req.body || !Buffer.isBuffer(req.body)) {
      throw new HttpException({
        message: 'Invalid request body'
      }, HttpStatus.BAD_REQUEST);
    }

    if (req.body.length > 10 * 1024 * 1024) {
      throw new HttpException({
        message: 'File size exceeds 10MB limit'
      }, HttpStatus.BAD_REQUEST);
    }

    try {
      const response = await this.appService.handleAudioQuestion({ buffer: req.body } as Express.Multer.File);
      if (!response) {
        throw new HttpException({
          message: 'Failed to generate audio response'
        }, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', 'audio/mp3');
      res.setHeader('Content-Disposition', 'attachment; filename="answer.mp3"');
      res.status(HttpStatus.OK).send(response);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException({
        message: 'Failed to process audio question'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
