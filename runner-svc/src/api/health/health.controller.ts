import { Request, Response } from 'express';

export const check = async (req: Request, res: Response) => {
  res.status(200).send({ ok: true });
};
