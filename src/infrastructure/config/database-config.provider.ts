// infrastructure/config/database-config.provider.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfigProvider {
  constructor(private configService: ConfigService) {}

  getDatabaseUri(): string {
    return this.configService.get<string>('DATABASE_URI');
  }
}
