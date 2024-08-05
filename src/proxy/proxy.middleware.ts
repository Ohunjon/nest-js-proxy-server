import { Injectable, NestMiddleware } from '@nestjs/common';
import {
  createProxyMiddleware,
  responseInterceptor
} from 'http-proxy-middleware';
import { Response, Request } from 'express';
import { JSDOM } from 'jsdom';
import { json } from 'stream/consumers';
import axios from 'axios';
import puppeteer from 'puppeteer';


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
          //  console.log('Proxying request to:', proxyReq.path);
        },
        proxyRes: responseInterceptor(
          async (responseBuffer, proxyRes, _req, res: Response) => {
            // console.log(`Received response with status: ${proxyRes.statusCode}`);
            // Determine the encoding from the headers or default to UTF-8
            //  const contentType = proxyRes.headers['content-type'] || '';
            //const charsetMatch = contentType.match(/charset=([^;]+)/);
            // const encoding = charsetMatch ? charsetMatch[1] : 'utf-8';

            if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {
              console.log('hi')

              // Decode buffer to a UTF-8 string
              const responseString = responseBuffer.toString('utf-8');

              // Use Puppeteer to render the SPA
              const browser = await puppeteer.launch({ headless: true });
              const page = await browser.newPage();

              // Set the content of the page to the response from the proxy
              await page.setContent(responseString, { waitUntil: 'domcontentloaded' });

              // Wait for the dynamic content to be rendered
              await page.waitForSelector('body', { timeout: 5000 });
              /// await this.waitForDynamicContent(page);
              // Modify the content if needed
              const modifiedHtml = await page.evaluate(() => {
                const addSymbolToTextNodes = (node: Node) => {
                  if (node.nodeType === Node.TEXT_NODE) {
                    if (node.parentNode.nodeName !== 'STYLE' && node.parentNode.nodeName !== 'SCRIPT') {

                      if (node.textContent.trim().length > 6) {
                        node.textContent = `+${node.textContent}+alijon`;
                      }
                    }
                  } else {
                    node.childNodes.forEach(addSymbolToTextNodes);
                  }
                };

                document.body.childNodes.forEach(addSymbolToTextNodes);

                return document.documentElement.outerHTML;
              });

              await browser.close();

              // Set the Content-Type header to text/html with UTF-8 encoding
              //  res.setHeader('Content-Type', 'text/html; charset=utf-8');
              // console.log('end', modifiedHtml);
              // return responseBuffer;
              return modifiedHtml
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



  async waitForDynamicContent(page, timeout = 20000, checkInterval = 2000) {
    const start = Date.now();
    let lastHTMLSize = 0;
    let stableTimes = 0;

    while (Date.now() - start < timeout) {
      const html = await page.content();
      const currentHTMLSize = html.length;

      if (currentHTMLSize !== lastHTMLSize) {
        stableTimes = 0;
        lastHTMLSize = currentHTMLSize;
      } else {
        stableTimes += 1;
      }

      if (stableTimes >= 3) {
        console.log('Content has stabilized.');
        return;
      }


      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    console.log('Timeout reached without stabilization.');
  }
}
