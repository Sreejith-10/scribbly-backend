import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Response } from 'express';
import { CurrentUser } from 'src/common/decorators';
import { User } from 'src/database/schema';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/u/:userId')
  async getUser(
    @CurrentUser() u: Omit<User, 'hashRt' | 'password'>,
    @Res() res: Response,
  ) {
    const user = await this.userService.getUser(u._id as string, u.email);
    return res.json({ data: { user }, message: 'success' });
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/u/:userId')
  async updateUserName(
    @Param() { userId }: { userId: string },
    @Body() { firstName, lastName }: { firstName: string; lastName: string },
    @Res() res: Response,
  ) {
    const user = await this.userService.updateUserName(
      userId,
      firstName,
      lastName,
    );
    return res.json({ data: { user }, message: 'username updated' });
  }
}
