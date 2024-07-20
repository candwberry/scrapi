import type { RequestHandler } from '@sveltejs/kit';
import http from 'http';
import https from 'https';
import { parse as urlParse } from 'url';

export const GET: RequestHandler = async ({ params, url }) => {
  const { path } = params;
  console.log(url);
  const targetUrl = `https://connect.raspberrypi.com/${path || 'sign-in'}`;
  const { protocol, hostname, port, path: pathname } = urlParse(targetUrl);

  const client = protocol === 'https:' ? https : http;

  return new Promise((resolve) => {
    const request = client.request(
      { hostname, port, path: pathname, method: 'GET' },
      (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });


        response.on('end', () => {
          const headers = { ...response.headers };
          delete headers['x-frame-options'];
      
          // Function to rewrite URLs
          const rewriteUrls = (html: string) => {
            return html.replace(
              /(href|src|action)=(["'])(\/[^"']*)(["'])/g,
              (match, attr, quote, url, endQuote) => {
                return `${attr}=${quote}/proxy${url}${endQuote}`;
              }
            );
          };
      
          // Rewrite URLs in the response
          data = rewriteUrls(data);
      
          resolve(
            new Response(data, {
              status: response.statusCode,
              headers,
            })
          );
        });
      }
    );

    request.on('error', (error) => {
      resolve(
        new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        })
      );
    });

    request.end();
  });
};

export const POST: RequestHandler = async ({ params, url, request }) => {
  const { path } = params;
  console.log(url);
  const targetUrl = `https://connect.raspberrypi.com/${path || 'sign-in'}`;
  const { protocol, hostname, port, path: pathname } = urlParse(targetUrl);

  const client = protocol === 'https:' ? https : http;

  return new Promise((resolve) => {
    const req = client.request(
      { hostname, port, path: pathname, method: 'POST' },
      (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          const headers = { ...response.headers };
          delete headers['x-frame-options'];
      
          // Function to rewrite URLs
          const rewriteUrls = (html: string) => {
            return html.replace(
              /(href|src|action)=(["'])(\/[^"']*)(["'])/g,
              (match, attr, quote, url, endQuote) => {
                return `${attr}=${quote}/proxy${url}${endQuote}`;
              }
            );
          };
      
          // Rewrite URLs in the response
          data = rewriteUrls(data);
      
          resolve(
            new Response(data, {
              status: response.statusCode,
              headers,
            })
          );
        });
      }
    );

    req.on('error', (error) => {
      resolve(
        new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        })
      );
    });

    req.write(request.body);
    req.end();
  });
}