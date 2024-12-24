import { Response } from 'express';

enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  SERVER_ERROR = 500
};

export const sendCreated = (res: Response, payload: any) => {
  res.status(HttpStatus.CREATED).send(payload);
};

export const sendSuccess = (res: Response, payload: any) => {
  res.status(HttpStatus.OK).send(payload);
};

export const sendBadRequest = (res: Response, error: string) => {
  res.status(HttpStatus.BAD_REQUEST).send({ error });
};

export const sendInternalError = (res: Response, error?: string) => {
  res.status(HttpStatus.SERVER_ERROR).send({
    error: error || 'Internal error. Please try again'
  });
};

export default {
  sendCreated,
  sendSuccess,
  sendBadRequest,
  sendInternalError
};