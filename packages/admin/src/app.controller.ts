import * as common from '@lerna-example/common';
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    common.log();
    return 'Hello World from Manual NestJS!';
  }
}
