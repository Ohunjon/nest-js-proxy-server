import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ProxyMiddleware } from './proxy/proxy.middleware';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),

    }),
  ],
  controllers: [],
  providers: []
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ProxyMiddleware).forRoutes('*');
  }
}
