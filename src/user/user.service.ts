import { Injectable, NotFoundException, UseInterceptors } from '@nestjs/common';
import { CatchErrorsInterceptor } from 'src/common/interceptor';
import { UsersRepository } from './user.respository';
import { User } from './schema';
import { Types } from 'mongoose';

@UseInterceptors(CatchErrorsInterceptor)
@Injectable()
export class UserService {
  constructor(private readonly usersRepository: UsersRepository) { }

  async getUser(email: string): Promise<User> {
    // Query for user from database
    return this.usersRepository.findOne({ email });
  }

  async findUserById(userId: string): Promise<User> {
    return this.usersRepository.findOne(
      { _id: new Types.ObjectId(userId) },
      { _id: true, email: true, username: true, avatarUrl: true },
    );
  }

  async sanitizedUser(email: string): Promise<User> {
    return this.usersRepository.findOne(
      { email },
      { _id: true, email: true, username: true, avatarUrl: true },
    );
  }

  async createUser(dto: Omit<User, '_id'>): Promise<User> {
    return this.usersRepository.create({ ...dto });
  }

  async updateUserName(email: string, username: string): Promise<User> {
    // Check if the user exist or not in database
    const user = await this.usersRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException('user does not exist');
    }

    const updatedUser = await this.usersRepository.findOneAndUpdate(
      {
        email,
      },
      {
        username,
      },
      {
        projection: {
          email: true,
          username: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    );

    return updatedUser as User;
  }

  async userHashToken(email: string, hashRt: string): Promise<User> {
    return this.usersRepository.findOneAndUpdate({ email }, { hashRt });
  }
}
