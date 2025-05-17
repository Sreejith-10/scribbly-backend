import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/database/user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    readonly configService: ConfigService,
    private readonly userRespository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request.cookies?.accessToken,
      ]),
      secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: { email: string }) {
    const user = await this.userRespository.findOne({ email: payload.email });
    delete user.password;
    return user;
  }
}
