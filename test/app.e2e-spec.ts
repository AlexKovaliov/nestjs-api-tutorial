import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import {
  CreateBookmarkDto,
  EditBookmarkDto,
} from '../src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef =
      await Test.createTestingModule({
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

    await prisma.cleanDb();
    pactum.request.setBaseUrl(
      'http://localhost:3333',
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'alex@gmail.com',
      password: '123456',
    };

    describe('Signup', () => {
      it('should throw if email empty', async () => {
        const message: unknown = await pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400)
          .returns('message');

        expect(message).toContain(
          'email should not be empty',
        );
      });

      it('should throw if password empty', async () => {
        const message: unknown = await pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400)
          .returns('message');

        expect(message).toContain(
          'password should not be empty',
        );
      });

      it('should throw if no body provided', async () => {
        const message: unknown = await pactum
          .spec()
          .post('/auth/signup')
          .withBody(undefined)
          .expectStatus(400)
          .returns('message');

        expect(message).toEqual(
          expect.arrayContaining([
            'email should not be empty',
            'password should not be empty',
          ]),
        );
      });

      it('should sighup', async () => {
        const token: unknown = await pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)
          .inspect()
          .returns('access_token');

        expect(token).toEqual(expect.any(String));
      });
    });

    describe('Signin', () => {
      it('should throw if email empty', async () => {
        const message: unknown = await pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400)
          .returns('message');

        expect(message).toContain(
          'email should not be empty',
        );
      });

      it('should throw if password empty', async () => {
        const message: unknown = await pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400)
          .returns('message');

        expect(message).toContain(
          'password should not be empty',
        );
      });

      it('should throw if no body provided', async () => {
        const message: unknown = await pactum
          .spec()
          .post('/auth/signin')
          .withBody(undefined)
          .expectStatus(400)
          .returns('message');

        expect(message).toEqual(
          expect.arrayContaining([
            'email should not be empty',
            'password should not be empty',
          ]),
        );
      });

      it('should sigin', async () => {
        const token: unknown = await pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token')
          .returns('access_token');

        expect(token).toEqual(expect.any(String));
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', async () => {
        const email: unknown = await pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .expectStatus(200)
          .returns('email');

        expect(email).toBe('alex@gmail.com');
      });
    });

    describe('Edit user', () => {
      it('should edit user', async () => {
        const dto: EditUserDto = {
          firstName: 'Alex',
          email: 'alex@gmail.com',
        };

        const user: unknown = await pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .withBody(dto)
          .expectStatus(200)
          .returns('res.body');

        expect(user).toMatchObject({
          firstName: dto.firstName,
          email: dto.email,
        });
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('should get bookmarks', async () => {
        const body: unknown = await pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .expectStatus(200)
          .returns('res.body');

        expect(body).toEqual([]);
      });
    });

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'First bookmark',
        link: 'https://www.youtube.com/watch?v=d6WC5n9G_sM',
      };

      it('should create bookmark', async () => {
        const id: unknown = await pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id')
          .returns('id');

        expect(id).toEqual(expect.any(Number));
      });
    });

    describe('Get bookmarks', () => {
      it('should get bookmarks', async () => {
        const body: unknown = await pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .expectStatus(200)
          .returns('res.body');

        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Number),
              title: 'First bookmark',
            }),
          ]),
        );
        expect(body).toHaveLength(1);
      });
    });

    describe('Get bookmark by id', () => {
      it('should get bookmark by id', async () => {
        const bookmark: unknown = await pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .expectStatus(200)
          .returns('res.body');

        expect(bookmark).toMatchObject({
          id: expect.any(Number),
          title: 'First bookmark',
        });
      });
    });

    describe('Edit bookmark by id', () => {
      it('should edit bookmark by id', async () => {
        const dto: EditBookmarkDto = {
          title: 'NestJs',
          description:
            'NestJs Course for Beginners - Create a REST API',
        };

        const bookmark: unknown = await pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withBody(dto)
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .expectStatus(200)
          .returns('res.body');

        expect(bookmark).toMatchObject({
          id: expect.any(Number),
          title: dto.title,
          description: dto.description,
        });
      });
    });

    describe('Delete bookmark by id', () => {
      it('should delete bookmark by id', async () => {
        const res = await pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .expectStatus(204)
          .toss();

        expect(res.statusCode).toBe(204);
      });

      it('should get empty bookmarks', async () => {
        const body: unknown = await pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .expectStatus(200)
          .returns('res.body');

        expect(body).toEqual([]);
      });
    });
  });
});
