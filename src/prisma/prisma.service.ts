import {
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString:
          process.env.DATABASE_URL,
      }),
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  cleanDb() {
    return this.$transaction([
      this.bookmark.deleteMany(),
      this.user.deleteMany(),
    ]);
  }
}
