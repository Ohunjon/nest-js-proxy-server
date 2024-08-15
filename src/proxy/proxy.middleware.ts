import { Injectable, NestMiddleware } from '@nestjs/common';
import {
  createProxyMiddleware,
  responseInterceptor
} from 'http-proxy-middleware';
import { Response, Request } from 'express';

enum TargetLink {
  NESTJSDOCS = 'https://docs.nestjs.com',
  VUEJSORG = 'https://vuejs.org'
}


@Injectable()
export class ProxyMiddleware implements NestMiddleware {

  use(req: Request, res: any, next: () => void) {
    let targetLink: TargetLink = TargetLink.NESTJSDOCS;
    let link: string = targetLink;
    if (req.originalUrl) {
      link = targetLink + req.originalUrl;
    }
    const proxy = createProxyMiddleware({
      target: `${link}`,
      changeOrigin: true,
      secure: true,
      selfHandleResponse: true,
      on: {
        proxyReq: (proxyReq, _req: Request, _res: Response) => {
          // console.log('Proxying request to:', _req.url);
        },
        proxyRes: responseInterceptor(
          async (responseBuffer, proxyRes, _req, res: Response) => {

            if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {

              // Decode buffer to a UTF-8 string
              const responseString = responseBuffer.toString('utf-8');
              // Insert the script before the closing </body> tag

              if (targetLink === (TargetLink.NESTJSDOCS as TargetLink)) {
                const modifiedContent = responseString.replace('</body>', `<script src="/scripts.js"></script></body>`);
                return modifiedContent;
              }
              if (targetLink === (TargetLink.VUEJSORG as TargetLink)) {
                const modifiedContent = responseString.replace('</body>', `<script src="/scripts-vue.js"></script></body>`);
                return modifiedContent;
              }
              return responseBuffer;
            }
            else {
              return responseBuffer;
            }
          }),
        error: (_err, _req, res: Response) => {
          console.log('error');
          if (!res.headersSent) {
            res.status(500).send('Proxy error');
          }
        }
      }
    });
    proxy(req, res, next);
  }
}
