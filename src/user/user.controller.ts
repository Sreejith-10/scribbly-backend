import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from 'src/common/decorators';
import { User } from 'src/database/schema';
import { JwtAuthGuard } from 'src/common/guards/auth';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/u')
  async getUser(@CurrentUser() u: Omit<User, 'hashRt' | 'password'>) {
    const user = await this.userService.getUser(u._id as string, u.email);
    return { user, message: 'success' };
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/u/:userId')
  async updateUserName(
    @Param() { userId }: { userId: string },
    @Body() { username }: { username: string },
  ) {
    const user = await this.userService.updateUserName(userId, username);
    return { user, message: 'username updated' };
  }
}
