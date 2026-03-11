import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { RequestUser } from '../types/request-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user: RequestUser }>();
    return req.user as RequestUser;
  },
);
