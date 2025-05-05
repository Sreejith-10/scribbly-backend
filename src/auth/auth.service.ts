import { ConflictException, Injectable } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly authRespository: AuthRepository) {}

  async register(dto: RegisterDto) {
    // checking if the user with email already exist
    const userExist = await this.authRespository.findOne({ email: dto.email });
    if (userExist) {
      throw new ConflictException('user with email already exist');
    }

    // hashing the password
    const hashedPass = await bcrypt.hash(dto.password, 12);

    // create new user
    const user = await this.authRespository.create({
      ...dto,
      password: hashedPass,
    });

    delete user.password; // delete the password from user object

    return user; // return created user
  }

  async login() {}

  async logout() {}

  async refresh() {}

  async verifyUser() {}
}
