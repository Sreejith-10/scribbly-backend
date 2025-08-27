import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import supertest, * as request from 'supertest';
import { AppModule } from 'src/app.module';

describe('Auth Controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Register User (Post)', () => {
    const registerUser = {
      username: 'Lopez Garcia',
      email: 'Lopez@gamil.com',
      password: '123456',
    };

    it('Successfully register', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerUser)
        .expect(201);
    });
  });
});
