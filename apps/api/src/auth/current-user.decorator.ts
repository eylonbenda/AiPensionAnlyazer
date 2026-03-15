import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@pension-analyzer/domain';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'> => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
