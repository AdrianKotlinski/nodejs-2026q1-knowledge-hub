import { Injectable } from '@nestjs/common';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '../common/errors';
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
    if (!user) throw new NotFoundError('User not found');
    return toResponse(user);
  }

  async create(dto: CreateUserDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          login: dto.login,
          password: await bcrypt.hash(dto.password, getSaltRounds()),
          role: (dto.role ?? UserRole.VIEWER) as unknown as any,
        },
      });
      return toResponse(user);
    } catch (err: any) {
      if (err?.code === 'P2002')
        throw new ValidationError('Login already taken');
      throw err;
    }
  }

  async updatePassword(id: string, dto: UpdatePasswordDto) {
    const hasRole = dto.role !== undefined;
    const hasPassword =
      dto.oldPassword !== undefined || dto.newPassword !== undefined;

    if (!hasRole && !hasPassword)
      throw new ValidationError('No update fields provided');

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');

    const data: Record<string, any> = {};

    if (hasRole) {
      data.role = dto.role;
    }

    if (hasPassword) {
      if (!dto.oldPassword || !dto.newPassword)
        throw new ValidationError('oldPassword and newPassword are required');
      const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
      if (!isMatch) throw new ForbiddenError('Old password is incorrect');
      data.password = await bcrypt.hash(dto.newPassword, getSaltRounds());
    }

    const updated = await this.prisma.user.update({ where: { id }, data });
    return toResponse(updated);
  }

  async findByLogin(login: string) {
    const user = await this.prisma.user.findUnique({ where: { login } });
    return user ? toResponse(user) : null;
  }

  async findByLoginWithPassword(login: string) {
    return this.prisma.user.findUnique({ where: { login } });
  }

  async count() {
    return this.prisma.user.count();
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');
    await this.prisma.user.delete({ where: { id } });
  }
}
