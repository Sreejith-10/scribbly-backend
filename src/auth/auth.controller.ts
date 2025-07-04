import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../common/guards/auth';
import { CurrentUser } from '../common/decorators';
import { User } from 'src/user/schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    const user = await this.authService.register(dto);
    return res.json({ message: 'user created successfully', user });
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(dto);
    res.cookie('accessToken', accessToken, { httpOnly: true });
    res.cookie('refreshToken', refreshToken, { httpOnly: true });
    return res.json({ message: 'logged in successfully', user });
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
    return { message: 'user logged out' };
  }

  @Get('refresh')
  async refresh() {
    return this.authService.refresh();
  }

  // @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('tokens')
  async tokens(@Req() req: Request) {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    const accessTokenHash = await this.authService.hashToken(accessToken);
    const refreshTokenHash = await this.authService.hashToken(refreshToken);

    return { accessTokenHash, refreshTokenHash };
  }
}
