'use strict';

import Stream from 'stream';
import Koa, { Request, Response } from 'koa';

export const context = (
  req: Request | undefined,
  res: Response | undefined,
  app: Koa | undefined
) => {
  const socket = new Stream.Duplex();
  req = Object.assign(
    {
      headers: {},
      socket
    },
    Stream.Readable.prototype,
    req
  );
  res = Object.assign(
    {
      _headers: {},
      socket
    },
    Stream.Writable.prototype,
    res
  );
  // @ts-ignore
  req.socket.remoteAddress = req.socket.remoteAddress || '127.0.0.1';
  app = app || new Koa();
  // @ts-ignore
  res.getHeader = k => res._headers[k.toLowerCase()];
  // @ts-ignore
  res.setHeader = (k, v) => (res._headers[k.toLowerCase()] = v);
  // @ts-ignore
  res.removeHeader = (k, v) => delete res._headers[k.toLowerCase()];
  // @ts-ignore
  return app.createContext(req, res);
};

export const request = (
  req: Request | undefined,
  res: Response | undefined,
  app: Koa | undefined
) => context(req, res, app).request;

export const response = (
  req: Request | undefined,
  res: Response | undefined,
  app: Koa | undefined
) => context(req, res, app).response;
