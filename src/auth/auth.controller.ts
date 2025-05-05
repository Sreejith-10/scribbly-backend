import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    const user = await this.authService.register(dto);
    return res.json({ message: 'user created successfully', data: { user } });
  }

  @Post('login')
  async login() {
    return this.authService.login();
  }

  @Get('logut')
  async logout() {
    return this.authService.logout();
  }

  @Get('refresh')
  async refresh() {
    return this.authService.refresh();
  }
}
