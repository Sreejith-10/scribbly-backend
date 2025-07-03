import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from 'src/database/schema';

type UserType = Pick<User, 'username' | 'email' | 'avatarUrl'>;

@Injectable()
export class WebsocketService {
  // users = new Map<string, Set<UserType>>();

  // constructor(private readonly userModel: Model<User>) {}
}
