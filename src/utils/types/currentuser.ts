import { User } from 'src/user/schema';

export type CurrentUserType = Omit<User, 'password' | 'hashRt'>;
