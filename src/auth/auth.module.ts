import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from 'src/database';
import { MongooseModule } from '@nestjs/mongoose';
import {
  JwtStrategy,
  LocalStrategy,
  JwtRefreshStrategy,
} from 'src/common/strategies/auth';
import { User, UserSchema } from 'src/database/schema';

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
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
