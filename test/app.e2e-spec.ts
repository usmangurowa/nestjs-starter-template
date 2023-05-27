import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';

describe('App E2E', () => {
  // starting logic
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDB();
  }, 10000);

  // ending logic
  afterAll(() => {
    app.close();
  });

  // tests

  describe('Auth', () => {
    describe('Signup', () => {
      it('Should Sign up', () => {
        return pactum
          .spec()
          .post('http://localhost:3333/auth/signup')
          .withBody({
            email: 'usmanhassangu@gmail.com',
            password: '12345678',
          })
          .expectStatus(201);
      });
    });

    describe('Signin', () => {});
  });

  describe('User', () => {
    describe('Get me', () => {});
    describe('Edit User', () => {});
  });
});
