import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import * as express from 'express';
import * as http from 'http';
describe('AppController (e2e)', () => {
  let app: INestApplication;
  let targetServer: http.Server;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create a mock target server
    const targetApp = express();
    targetApp.get('/', (req, res) => {
      res.send('This is the target server response');
    });

    targetServer = targetApp.listen(4000);
  });

  afterAll(async () => {
    await app.close();
    targetServer.close();
  });

  it('should forward the request to the target server', () => {
    return request(app.getHttpServer()).get('/').expect(200);
  });
});
