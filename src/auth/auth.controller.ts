import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/auth';
import { CurrentUser } from '../common/decorators';
import { User } from 'src/database/schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    const user = await this.authService.register(dto);
    return res.json({ message: 'user created successfully', data: { user } });
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    res.cookie('accessToken', accessToken, { httpOnly: true });
    res.cookie('refreshToken', refreshToken, { httpOnly: true });
    return res.json({ message: 'logged in successfully' });
  }

  @HttpCode(HttpStatus.OK)
  @Patch('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: Omit<User, 'password' | 'hashRt'>,
    @Res() res: Response,
  ) {
    await this.authService.logout(user.email);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.json({ message: 'user logged out' });
  }

  @Get('refresh')
  async refresh() {
    return this.authService.refresh();
  }
}
