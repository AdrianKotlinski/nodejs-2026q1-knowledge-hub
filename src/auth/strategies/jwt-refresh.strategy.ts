import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '../../common/enums';

interface JwtPayload {
  sub: string;
  login: string;
  role: UserRole;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET_REFRESH_KEY,
    });
  }

  validate(payload: JwtPayload) {
    return { userId: payload.sub, login: payload.login, role: payload.role };
  }
}
