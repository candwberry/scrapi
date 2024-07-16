import type { RequestHandler } from '@sveltejs/kit';
import http from 'http';
import https from 'https';
import { parse as urlParse } from 'url';

export const GET: RequestHandler = async ({ params, url }) => {
  const { path } = params;
  const targetUrl = `https://connect.raspberrypi.com/${path}`;
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
