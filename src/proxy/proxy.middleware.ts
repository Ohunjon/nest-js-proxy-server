import { Injectable, NestMiddleware } from '@nestjs/common';
import {
  createProxyMiddleware,
  responseInterceptor
} from 'http-proxy-middleware';
import { Response, Request } from 'express';
import { JSDOM } from 'jsdom';

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  processTextNodes(node: any) {
    const TEXT_NODE_TYPE = 3;

    if (node.nodeType === TEXT_NODE_TYPE) {
      const parentNode = node.parentNode;
      const text = node.textContent.trim();

      if (parentNode.nodeName !== 'STYLE' && parentNode.nodeName !== 'SCRIPT') {
        if (text && text.length === 6) {
          node.textContent = text + '™';
        }
      }
      //}
    } else {
      // If the node is not a text node, recursively process its child nodes
      node.childNodes.forEach((child: any) => this.processTextNodes(child));
    }
    return node;
  }

  use(req: Request, res: any, next: () => void) {
    let targetLink = 'https://somon.tj';
    if (req.originalUrl) {
      targetLink = targetLink + req.originalUrl;
    }
    // console.log(targetLink);
    const proxy = createProxyMiddleware({
      target: `${targetLink}`,
      changeOrigin: true,
      secure: false,
      selfHandleResponse: true,
      on: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        proxyReq: (proxyReq, _req: Request, _res: Response) => {
          /* handle proxyReq */
          console.log('Proxying request to:', proxyReq.path);
        },
        proxyRes: responseInterceptor(
          async (responseBuffer, proxyRes, _req, res: Response) => {
            res.removeHeader('content-security-policy');
            const contentType = proxyRes.headers['content-type'];
            if (!contentType?.startsWith('image/')) {
              const response = responseBuffer.toString('utf8');
              const dom = new JSDOM(response);

              const document = dom.window.document;
              const documentOrg = dom.window.document;
              let bodyContent = document.querySelector('body');

              if (bodyContent) {
                bodyContent = this.processTextNodes(bodyContent);
              }

              const oldBody = documentOrg.querySelector('body');
              oldBody.parentNode.replaceChild(bodyContent, oldBody);

              return dom.serialize();
            }
            const statusCode = res.statusCode === 200 ? res.statusCode : 500;
            res.status(statusCode);
            return responseBuffer;
          }
        ),

        error: (_err, _req, res: Response) => {
          console.log('error');

          res.writeHead(500, {
            'Content-Type': 'aplication/json'
          });
          res.end(
            'Something went wrong. And we are reporting a custom error message.'
          );
        }
      }
    });
    proxy(req, res, next);
  }
}
