import { Controller, Get } from '@nestjs/common';
import * as common from '@rubyceng/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    common.log();
    return 'Hello World from Manual NestJS!';
  }
}
