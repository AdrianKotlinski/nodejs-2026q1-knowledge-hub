import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

const toResponse = (user: User) => ({
  id: user.id,
  login: user.login,
  role: user.role as unknown as UserRole,
  createdAt: user.createdAt.getTime(),
  updatedAt: user.updatedAt.getTime(),
});

const getSaltRounds = () => parseInt(process.env.CRYPT_SALT ?? '10', 10);

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map(toResponse);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return toResponse(user);
  }

  async create(dto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: await bcrypt.hash(dto.password, getSaltRounds()),
        role: (dto.role ?? UserRole.VIEWER) as unknown as any,
      },
    });
    return toResponse(user);
  }

  async updatePassword(id: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) throw new ForbiddenException('Old password is incorrect');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: await bcrypt.hash(dto.newPassword, getSaltRounds()) },
    });
    return toResponse(updated);
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.delete({ where: { id } });
  }
}
