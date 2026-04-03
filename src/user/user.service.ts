import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { db, User, UserRole } from '../db/in-memory.store';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

const toResponse = (user: User): Omit<User, 'password'> => ({
  id: user.id,
  login: user.login,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getSaltRounds = () => parseInt(process.env.CRYPT_SALT ?? '10', 10);

@Injectable()
export class UserService {
  findAll() {
    return Array.from(db.users.values()).map(toResponse);
  }

  findOne(id: string) {
    const user = db.users.get(id);
    if (!user) throw new NotFoundException('User not found');
    return toResponse(user);
  }

  async create(dto: CreateUserDto) {
    const now = Date.now();
    const user: User = {
      id: crypto.randomUUID(),
      login: dto.login,
      password: await bcrypt.hash(dto.password, getSaltRounds()),
      role: dto.role ?? UserRole.VIEWER,
      createdAt: now,
      updatedAt: now,
    };
    db.users.set(user.id, user);
    return toResponse(user);
  }

  async updatePassword(id: string, dto: UpdatePasswordDto) {
    const user = db.users.get(id);
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) throw new ForbiddenException('Old password is incorrect');

    user.password = await bcrypt.hash(dto.newPassword, getSaltRounds());
    user.updatedAt = Date.now();
    return toResponse(user);
  }

  remove(id: string) {
    const user = db.users.get(id);
    if (!user) throw new NotFoundException('User not found');

    db.articles.forEach((article) => {
      if (article.authorId === id) {
        article.authorId = null;
        article.updatedAt = Date.now();
      }
    });

    db.comments.forEach((comment, commentId) => {
      if (comment.authorId === id) {
        db.comments.delete(commentId);
      }
    });

    db.users.delete(id);
  }
}
