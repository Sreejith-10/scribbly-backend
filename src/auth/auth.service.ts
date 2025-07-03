import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from 'src/user/user.respository';
import { User } from 'src/user/schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRespository: UsersRepository,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<User> {
    // checking if the user with email already exist
    const userExist = await this.userRespository.exists({ email: dto.email });
    if (userExist) {
      throw new ConflictException('user with email already exist');
    }

    // hashing the password
    const hashedPass = await bcrypt.hash(dto.password, 12);

    // create new user
    const user = await this.userRespository.create({
      ...dto,
      password: hashedPass,
      hashRt: null,
    });

    delete user.password; // delete the password from user object
    delete user.hashRt;

    return user; // return created user
  }

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: User;
  }> {
    // Checking if the user exist
    const user = await this.userRespository.findOne({ email: dto.email });
    if (user) {
      throw new NotFoundException('user with email does not exist');
    }

    // comparing passwords
    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new BadRequestException('password does not match');
    }

    // Generating tokens if the password matches
    const accessToken = this.generateToken(
      {
        uid: user._id,
        email: user.email,
        name: user.username,
      },
      this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      this.configService.get<number>('JWT_ACCESS_TOKEN_EXPIRATION'),
    );
    const refreshToken = this.generateToken(
      {
        uid: user._id,
        email: user.email,
        name: user.username,
      },
      this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRATION'),
    );

    await this.userRespository.findOneAndUpdate(
      { email: dto.email },
      { hashRt: await bcrypt.hash(refreshToken, 12) },
    ); // stores refreshtoken in database

    delete user.password; // delete the password from user object
    delete user.hashRt;

    return { accessToken, refreshToken, user }; // returns the generated tokens
  }

  async logout(email: string) {
    return this.userRespository.findOneAndUpdate({ email }, { hashRt: null });
  }

  async refresh() {}

  async verifyUser(email: string, password: string) {
    // Checking if the user exist
    const user = await this.userRespository.findOne({ email });
    if (!user) {
      throw new NotFoundException('user with email does not exist');
    }

    // comparing passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new BadRequestException('password does not match');
    }

    delete user.password;
    delete user.hashRt;

    return user;
  }

  async verifyRefreshToken(refreshToken: string, email: string) {
    // Checking if the user exist
    const user = await this.userRespository.findOne({ email });
    if (!user) {
      throw new NotFoundException('user with email does not exist');
    }

    const authenticated = await bcrypt.compare(refreshToken, user.hashRt);

    if (!authenticated) {
      throw new UnauthorizedException('user not authorized');
    }

    delete user.password;
    delete user.hashRt;

    return user;
  }

  private generateToken(payload: any, secret: string, expires: number) {
    return jwt.sign(payload, secret, { expiresIn: expires });
  }

  async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 12);
  }
}
