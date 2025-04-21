import { ServerException } from '@/exceptions';
import { type ctx, type slowDown as slowDownType } from '@/interfaces/middlewares';

const slowDown = (timer: slowDownType) => {
  return async (ctx: ctx) => {
    const { next, onError, onSuccess, onComplete } = ctx;
    try {
      if (typeof timer !== 'object') {
        throw new Error('Invalid timer type');
      }
      if ('onError' in timer) {
        onError.push(() => new Promise(resolve => setTimeout(resolve, timer.onError)));
      } else if ('onSuccess' in timer) {
        onSuccess.push(() => new Promise(resolve => setTimeout(resolve, timer.onSuccess)));
      } else if ('onComplete' in timer) {
        onComplete.push(() => new Promise(resolve => setTimeout(resolve, timer.onComplete)));
      } else {
        await new Promise(resolve => setTimeout(resolve, timer.onComplete));
      }
      await next();
    } catch (err) {
      throw new ServerException(500, 'slowDown Middleware' + err);
    }
  };
};

export default slowDown;
