import { Injectable, NotFoundException, UseInterceptors } from '@nestjs/common';
import { CatchErrorsInterceptor } from 'src/common/interceptor';
import { User } from 'src/database/schema';
import { UsersRepository } from './user.respository';

@UseInterceptors(CatchErrorsInterceptor)
@Injectable()
export class UserService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getUser(userId: string, email: string): Promise<User> {
    // Query for user from database
    const user = await this.usersRepository.findOne(
      { _id: userId, email },
      { _id: true, email: true, username: true, avatarUrl: true },
    );

    // Check if the user exist
    if (!user) {
      throw new NotFoundException('user not found');
    }

    return user as User;
  }

  async updateUserName(userId: string, username: string): Promise<User> {
    // Check if the user exist or not in database
    const user = await this.usersRepository.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundException('user does not exist');
    }

    const updatedUser = await this.usersRepository.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        username,
      },
    );

    return updatedUser as User;
  }
}
