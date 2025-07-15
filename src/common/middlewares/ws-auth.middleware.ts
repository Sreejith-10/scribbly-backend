import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

declare module 'socket.io' {
  interface Socket {
    user: {
      uid: string;
      email: string;
      name: string;
    };
  }
}

@Injectable()
export class WsAuthMiddleware {
  private logger = new Logger(WsAuthMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(socket: Socket, next: (err?: Error) => void) {
    const token = socket.handshake.headers.cookie;
    const accessToken = this.transformCookie(token, 'accessToken');
    const refreshToken = this.transformCookie(token, 'refreshToken');
    if (!accessToken && !refreshToken) {
      return next(new Error('Not authenticated'));
    }
    const aT = await this.verifyToken(
      accessToken,
      this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
    );
    if (!aT.expired) {
      socket.user = aT.data;
      next();
    }

    const rT = await this.verifyToken(
      refreshToken,
      this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
    );

    if (!rT.expired) {
      socket.user = rT.data;
      next();
    } else {
      return next(new Error('not authenticated'));
    }
  }

  transformCookie(token: string, cookieName: string) {
    const splited = token?.split('; ');
    const cookieFromSplit = splited?.find((c) =>
      c.startsWith(`${cookieName}=`),
    );
    return cookieFromSplit ? cookieFromSplit?.split('=')[1] : null;
  }

  async verifyToken(token: string, secret) {
    try {
      const data = await this.jwtService.verifyAsync(token, {
        secret,
      });
      return { data, expired: false, valid: true };
    } catch (error) {
      return {
        data: null,
        expired: error.name === 'TokenExpiredError',
        valid: false,
      };
    }
  }
}
