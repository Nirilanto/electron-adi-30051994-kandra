import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
