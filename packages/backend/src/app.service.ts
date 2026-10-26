import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth(): { status: "ok"; uptime: number } {
    return { status: "ok", uptime: Math.round(process.uptime()) };
  }
}
