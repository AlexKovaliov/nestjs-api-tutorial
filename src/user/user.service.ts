import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async editUser(
    userId: number,
    dto: EditUserDto,
  ) {
    return await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...dto,
      },
      omit: {
        hash: true,
      },
    });
  }
}
