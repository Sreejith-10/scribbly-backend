import { User } from 'src/database/schema';

export type CurrentUserType = Omit<User, 'password' | 'hashRt'>;
