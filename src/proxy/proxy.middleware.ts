import { Injectable, NestMiddleware } from '@nestjs/common';
import {
  createProxyMiddleware,
  responseInterceptor
} from 'http-proxy-middleware';
import { Response, Request } from 'express';
import { JSDOM } from 'jsdom';
import { json } from 'stream/consumers';
import axios from 'axios';

@Injectable()
export class ProxyMiddleware implements NestMiddleware {

  processTextNodes(node: any) {
    const TEXT_NODE_TYPE = 3;

    if (node.nodeType === TEXT_NODE_TYPE) {
      const parentNode = node.parentNode;
      const text = node.textContent.trim();

      if (parentNode.nodeName !== 'STYLE' && parentNode.nodeName !== 'SCRIPT') {
        if (text && text.length > 6) {
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
    let targetLink = 'https://docs.nestjs.com/';
    if (req.originalUrl) {
      targetLink = targetLink + req.originalUrl;
    }
    // console.log(targetLink);
    const proxy = createProxyMiddleware({
      target: `${targetLink}`,
      changeOrigin: true,
      secure: true,
      // timeout: 5000, // Timeout for the proxy request in milliseconds
      // proxyTimeout: 5000,
      selfHandleResponse: true,
      on: {
        //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
        proxyReq: (proxyReq, _req: Request, _res: Response) => {
          /* handle proxyReq */
          console.log('Proxying request to:', proxyReq.path);
        },
        proxyRes: responseInterceptor(
          async (responseBuffer, proxyRes, _req, res: Response) => {
            console.log(`Received response with status: ${proxyRes.statusCode}`);
            // res.removeHeader('content-security-policy');
            // const contentType = proxyRes.headers['content-type'];
            // if (!contentType?.startsWith('image/')) {
            // const response = responseBuffer.toString('utf8');
            // console.log(responseBuffer.toString('utf-8'));
            // const dom = new JSDOM(response);

            // const document = dom.window.document;
            // const documentOrg = dom.window.document;
            // let bodyContent = document.querySelector('body');

            // if (bodyContent) {
            //   //  bodyContent = this.processTextNodes(bodyContent);
            // }

            // const oldBody = documentOrg.querySelector('body');
            // oldBody.parentNode.replaceChild(bodyContent, oldBody);

            //return dom.serialize();
            //}
            // const statusCode = res.statusCode === 200 ? res.statusCode : 500;
            //res.status(statusCode);
            // return JSON.stringify(responseBuffer);

            // const responseStringg = responseBuffer.toString('utf8');
            // const dom = new JSDOM(responseStringg);
            // const document = dom.window.document;
            // let responseString = document.body.innerHTML;
            // const responseString = bodyContent.toString('utf8');

            // res.setHeader('Content-Type', 'application/json');

            // Return the modified response string
            // return this.processTextNodes(document.querySelector('body')).innerHTML;
            // Add a script to send a request after all resources are loaded

            //return responseString;

            let data = '';


            proxyRes.on('data', (chunk: any) => {
              console.log('on data')
              data += chunk;
            });

            proxyRes.on('end', async () => {

              //  const responseStringg = responseBuffer.toString('utf8');
              // const dom = new JSDOM(data);
              // const document = dom.window.document;
              // Wait for all resources to be fetched

              // let responseString = document.body.innerHTML;
              //  await this.fetchAllResources(document);
              // let responseString = document.body.innerHTML;
              console.log('on data end');
            });

            return responseBuffer;
          }
        ),

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

  async fetchAllResources(document) {
    const promises = [];
    const resources = document.querySelectorAll('img[src], link[href], script[src]');

    resources.forEach(resource => {
      const url = resource.src || resource.href;

      if (url) {
        promises.push(
          axios.get(url)
            .then(response => {
              console.log(`Fetched resource: ${url}`);
              return response.data;
            })
            .catch(error => {
              console.error(`Error fetching resource: ${url}`, error);
            })
        );
      }
    });

    // Wait for all fetch requests to complete
    await Promise.all(promises);
  }
}
