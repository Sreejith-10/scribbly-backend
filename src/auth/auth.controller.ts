import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { Response, Request } from 'express';
import { JwtAuthGuard, JwtRefreshAuthGuard } from '../common/guards/auth';
import { CurrentUser } from '../common/decorators';
import { User } from 'src/user/schema';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) { }

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
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      expires: new Date(
        Date.now() +
        Number(this.configService.get<number>('JWT_ACCESS_TOKEN_EXPIRATION')),
      ),
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      expires: new Date(
        Date.now() +
        Number(
          this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRATION'),
        ),
      ),
    });
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
    return res.json({ message: 'user logged out' });
  }

  @HttpCode(HttpStatus.OK)
  @Get('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  async refresh(
    @Req() req: Request,
    @CurrentUser() user: Omit<User, 'password' | 'hashRt'>,
    @Res() res: Response,
  ) {
    const accessToken = await this.authService.refresh(
      user.email,
      req.cookies.refreshToken,
    );

    res.cookie('accessToken', accessToken, { httpOnly: true });
    return res.json({ message: 'user refreshed', accessToken });
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

  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('session')
  async verifySession(@Req() req: Request, @Res() res: Response) {
    const { data, newAccessToken } = await this.authService.verifySession(
      req.cookies.accessToken,
      req.cookies.refreshToken,
    );

    res.cookie('accessToken', newAccessToken, { httpOnly: true })
    res.json({ data })
  }
}
