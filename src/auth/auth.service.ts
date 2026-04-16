import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { SignupDto } from './dto/signup.dto';

interface JwtPayload {
  sub: string;
  login: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.userService.findByLogin(dto.login);
    if (existing) throw new BadRequestException('Login already taken');
    return this.userService.create({ login: dto.login, password: dto.password });
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByLoginWithPassword(dto.login);
    if (!user) throw new ForbiddenException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new ForbiddenException('Invalid credentials');

    return this.issueTokens({ sub: user.id, login: user.login, role: user.role as UserRole });
  }

  refresh(dto: RefreshDto) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: process.env.JWT_SECRET_REFRESH_KEY,
      });
      return this.issueTokens({ sub: payload.sub, login: payload.login, role: payload.role });
    } catch {
      throw new ForbiddenException('Invalid or expired refresh token');
    }
  }

  private issueTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_KEY,
      expiresIn: process.env.TOKEN_EXPIRE_TIME,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_REFRESH_KEY,
      expiresIn: process.env.TOKEN_REFRESH_EXPIRE_TIME,
    });
    return { accessToken, refreshToken };
  }
}
