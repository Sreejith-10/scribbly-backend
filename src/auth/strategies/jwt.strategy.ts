import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request.cookies?.Authentication,
      ]),
      secretOrKey: configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  async validate() {
    // return this.prismaService.user.findFirst({
    //   where: { uid: payload.uid },
    //   select: {
    //     uid: true,
    //     fname: true,
    //     lname: true,
    //     email: true,
    //     avatarUrl: true,
    //     hashRt: true,
    //     createdAt: true,
    //     updatedAt: true,
    //   },
    // });
  }
}
