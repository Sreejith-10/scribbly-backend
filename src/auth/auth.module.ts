import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from 'src/database';
import { MongooseModule } from '@nestjs/mongoose';
import { Auth, AuthSchema } from '../database/auth';
import { AuthRepository } from 'src/database/auth';
import {
  JwtStrategy,
  LocalStrategy,
  JwtRefreshStrategy,
} from 'src/strategies/auth';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SERCRET'),
        signOptions: {
          expiresIn: configService.get<string | number>('JWT_EXPIRATION'),
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: Auth.name, schema: AuthSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    JwtRefreshStrategy,
    AuthRepository,
  ],
})
export class AuthModule {}
