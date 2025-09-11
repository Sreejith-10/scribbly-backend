import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from 'src/common/decorators';
import { User } from 'src/user/schema';
import { JwtAuthGuard } from 'src/common/guards/auth';
import { CurrentUserType } from 'src/utils/types';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @HttpCode(HttpStatus.OK)
  @Get('/u')
  async getUser(@CurrentUser() u: Omit<User, 'hashRt' | 'password'>) {
    const user = await this.userService.getUser(u.email);
    return { user, message: 'success' };
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/u/:userId')
  async updateUserName(
    @CurrentUser() currentUser: CurrentUserType,
    @Body() { username }: { username: string },
  ) {
    const user = await this.userService.updateUserName(
      currentUser.email,
      username,
    );
    return { user, message: 'username updated' };
  }
}
