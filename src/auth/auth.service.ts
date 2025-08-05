import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/schema';
import { UserService } from 'src/user';
import { hash } from 'src/utils/helper';

@Injectable()
export class AuthService {
  protected readonly logger = new Logger();

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<User> {
    // checking if the user with email already exist
    const userExist = await this.userService.getUser(dto.email);
    if (userExist) {
      throw new ConflictException('user with email already exist');
    }

    // hashing the password
    const hashedPass = await hash(dto.password, 12);

    // create new user
    const user = await this.userService.createUser({
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
    const user = await this.userService.getUser(dto.email);
    if (!user) {
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

    const hashRt = await hash(refreshToken, 12);
    await this.userService.userHashToken(user.email, hashRt); // stores refreshtoken in database

    delete user.password; // delete the password from user object
    delete user.hashRt;

    return { accessToken, refreshToken, user }; // returns the generated tokens
  }

  async logout(email: string) {
    return this.userService.userHashToken(email, null);
  }

  async refresh(email: string, Rt: string) {
    const user = await this.userService.getUser(email);

    if (!user) {
      throw new ForbiddenException('access denied');
    }

    const valid = await bcrypt.compare(Rt, user.hashRt);

    if (!valid) {
      throw new UnauthorizedException('user not authorized');
    }

    const generateAT = this.generateToken(
      {
        uid: user._id,
        email: user.email,
        name: user.username,
      },
      this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      this.configService.get<number>('JWT_ACCESS_TOKEN_EXPIRATION'),
    );

    return generateAT;
  }

  async verifyUser(email: string, password: string) {
    // Checking if the user exist
    const user = await this.userService.getUser(email);
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

  private generateToken(payload: any, secret: string, expires: number) {
    return jwt.sign(payload, secret, { expiresIn: expires });
  }

  async hashToken(token: string): Promise<string> {
    return hash(token, 12);
  }

  async verifySession(aT: string, rT: string) {
    if (!aT && !rT) {
      throw new UnauthorizedException();
    }

    const { expired, data } = await this.verifyJwt(
      aT,
      this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
    );

    if (expired) {
      const { expired, data } = await this.verifyJwt(
        rT,
        this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      );

      if (expired) {
        throw new UnauthorizedException();
      }

      return { data };
    }

    return { data };
  }

  private async verifyJwt(token: string, secret: string) {
    let expired = false;
    let data = null;

    jwt.verify(token, secret, (error, decode) => {
      if (error) {
        if (error.message.includes('jwt expired')) {
          expired = true;
        }
      }

      if (decode) {
        data = decode;
      }
    });

    return { expired, data };
  }
}
