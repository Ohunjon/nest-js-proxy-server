import { Injectable, NestMiddleware } from '@nestjs/common';
import {
  createProxyMiddleware,
  responseInterceptor
} from 'http-proxy-middleware';
import { Response, Request } from 'express';


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

  generateDinamicScript() {
    return `
          <script>
            function addTrademarkSymbolToTextNodes(node) {
              if (node.nodeType === Node.TEXT_NODE) {
                const trimmedText = node.textContent.trim();
                if (trimmedText.length > 6 && !trimmedText.includes('™')) {
                  node.textContent = trimmedText + '™';
                }
              } else {
                node.childNodes.forEach(addTrademarkSymbolToTextNodes);
              }
            }

            function modifyTextContent() {
              document.body.childNodes.forEach(addTrademarkSymbolToTextNodes);
            }

            // Modify content on initial load
            window.addEventListener('load', modifyTextContent);

            
            function setupRouteChangeListeners() {
              window.addEventListener('popstate', modifyTextContent);
              window.addEventListener('pushState', modifyTextContent);
              window.addEventListener('replaceState', modifyTextContent);

              // Check for history API changes
              const originalPushState = history.pushState;
              const originalReplaceState = history.replaceState;

              history.pushState = function() {
                originalPushState.apply(this, arguments);
                window.dispatchEvent(new Event('pushState'));
              };

              history.replaceState = function() {
                originalReplaceState.apply(this, arguments);
                window.dispatchEvent(new Event('replaceState'));
              };
            }

  
            setupRouteChangeListeners();

            let previousUrl = '';
const observer = new MutationObserver(function(mutations) {
  if (location.href !== previousUrl) {
      previousUrl = location.href;
      modifyTextContent();
    }
});
const config = {subtree: true, childList: true};
observer.observe(document, config);


window.navigation.addEventListener("navigate", (event) => {
   modifyTextContent();
});
          </script>
        `;
  }

  use(req: Request, res: any, next: () => void) {
    let targetLink = 'https://docs.nestjs.com';
    if (req.originalUrl) {
      targetLink = targetLink + req.originalUrl;
    }
    const proxy = createProxyMiddleware({
      target: `${targetLink}`,
      changeOrigin: true,
      secure: true,
      selfHandleResponse: true,
      on: {
        proxyReq: (proxyReq, _req: Request, _res: Response) => {
          //  console.log('Proxying request to:', proxyReq.path);
        },
        proxyRes: responseInterceptor(
          async (responseBuffer, proxyRes, _req, res: Response) => {

            if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {
              // Decode buffer to a UTF-8 string
              const responseString = responseBuffer.toString('utf-8');

              const scriptToInject = this.generateDinamicScript();

              // Insert the script before the closing </body> tag
              const modifiedContent = responseString.replace('</body>', `${scriptToInject}</body>`);

              return Buffer.from(modifiedContent, 'utf8');
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
