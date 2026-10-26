import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { AppService } from "./app.service.js";
import { Public } from "./auth/index.js";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @SkipThrottle()
  @Get("health")
  getHealth() {
    return this.appService.getHealth();
  }
}
