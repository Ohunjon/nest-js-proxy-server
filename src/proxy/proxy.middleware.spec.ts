import { Test, TestingModule } from '@nestjs/testing';
import { ProxyMiddleware } from './proxy.middleware';
import { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

jest.mock('http-proxy-middleware', () => {
  const originalModule = jest.requireActual('http-proxy-middleware');
  return {
    ...originalModule,
    createProxyMiddleware: jest
      .fn()
      .mockImplementation((options) => (req, res, next) => {
        // Store the options for later inspection in the test
        (createProxyMiddleware as any).options = options;
        next();
      })
  };
});

describe('ProxyMiddleware', () => {
  let proxyMiddleWare: ProxyMiddleware;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProxyMiddleware]
    }).compile();

    proxyMiddleWare = module.get<ProxyMiddleware>(ProxyMiddleware);
  });

  it('should be defined', () => {
    expect(proxyMiddleWare).toBeDefined();
  });

  it('check middleware', () => {
    const req = {
      method: 'GET',
      url: '/'
    } as Request;

    const res = {} as Response;
    const next = jest.fn();
    proxyMiddleWare.use(req, res, next);

    expect(createProxyMiddleware).toHaveBeenCalled();

    const options = (createProxyMiddleware as any).options;
    expect(options).toMatchObject({
      target: 'https://somon.tj',
      changeOrigin: true,
      selfHandleResponse: true
    });

    expect(next).toHaveBeenCalled();
  });
});
