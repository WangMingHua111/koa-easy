import { Context, Next } from "koa";
import compose from 'koa-compose'
import Router from '@koa/router'
import "reflect-metadata";

const TKEY = 'design:type'
const PKEY = 'design:paramtypes'
const RKEY = 'design:returntype'
const router = new Router()

export const MVC_CONTROLLER = 'mvc:controller'
export const MVC_METHOD = 'mvc:method'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'DELETE'


const controllers = new Set<Function>()
const paths: Record<RequestMethod, any> = {
  'GET': {},
  'POST': {},
  'PUT': {},
  'PATCH': {},
  'OPTIONS': {},
  'HEAD': {},
  'DELETE': {}
}
//#region Decorators
/**
 * 控制器，控制器
 * @param route 
 * @returns 
 */
export function Controller(route?: string): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata(MVC_CONTROLLER, route, target)
    controllers.add(target)
  }
}
// export function FromBody(): ParameterDecorator { }
// export function FromForm(): ParameterDecorator { }
// export function FromHeader(): ParameterDecorator { }
// export function FromQuery(): ParameterDecorator { }
// export function FromRoute(): ParameterDecorator { }
// export function HttpDelete(): MethodDecorator { }
export function HttpGet(route?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
    Reflect.defineMetadata(MVC_METHOD, `GET:${new String(propertyKey)}`, target)
    router.get(`test/${route}`, async (ctx: Context, next: Next) => {
      ctx.body = '' + new Date().toLocaleString()
      return await next()
    })
  }
}
// export function HttpHead(): MethodDecorator { }
// export function HttpOptions(): MethodDecorator { }
// export function HttpPatch(): MethodDecorator { }
// export function HttpPost(): MethodDecorator { }
// export function HttpPut(): MethodDecorator { }
// export function Route(): ClassDecorator | MethodDecorator { }
// export function AllowAnonymous(): ClassDecorator | MethodDecorator { }
// export function Authorize(): ClassDecorator | MethodDecorator { }
// #endif

//#region Class
export abstract class ControllerBase { }

const m = router.routes()
/**
 * Koa 中间件
 * @param this 
 * @param ctx 
 * @param next 
 */
export function Middleware() {
  // return compose(router.routes(), router.allowedMethods())
}

// #endif

// export s from ''