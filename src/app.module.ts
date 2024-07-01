import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ProxyMiddleware } from './proxy/proxy.middleware';

@Module({
  imports: [],
  controllers: [],
  providers: []
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ProxyMiddleware).forRoutes('*');
  }
}
