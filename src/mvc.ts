import "reflect-metadata";
import { Context, Next } from "koa";
import compose from 'koa-compose'
import Router from '@koa/router'

import { IScopeService, TransientScopeService, SingletonScopeService, Lifecycle } from './utils'

const TKEY = 'design:type'
const PKEY = 'design:paramtypes'
const RKEY = 'design:returntype'
const router = new Router()

export const MVC_CONTROLLER = 'mvc:controller'
export const MVC_METHOD = 'mvc:method'

type RequestMethod = 'get' | 'post' | 'put' | 'patch' | 'options' | 'head' | 'delete'
type RecordMethods = { [key in RequestMethod]: Array<{ route?: string, propertyKey: string }> }

const controllers = new Set<IScopeService>()
const getRecordMethods = (target: Object): RecordMethods => {
  if (!Reflect.hasMetadata(MVC_METHOD, target.constructor)) {
    const methods: RecordMethods = {
      "delete": [],
      "get": [],
      "head": [],
      "options": [],
      "post": [],
      "put": [],
      "patch": []
    }
    Reflect.defineMetadata(MVC_METHOD, methods, target.constructor)
  }
  return Reflect.getMetadata(MVC_METHOD, target.constructor)
}

//#region Decorators
/**
 * 控制器，控制器
 * @param route 
 * @returns 
 */
export function Controller(route?: string, lifecycle: Lifecycle = 'singleton'): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata(MVC_CONTROLLER, route || target.name.replace(/Controller$/i, ''), target)
    let service: IScopeService
    switch (lifecycle) {
      case "singleton":
        service = new SingletonScopeService(target)
        break;
      case "transient":
      default:
        service = new TransientScopeService(target)
        break;
    }
    controllers.add(service)
  }
}
// export function FromBody(): ParameterDecorator { }
// export function FromForm(): ParameterDecorator { }
// export function FromHeader(): ParameterDecorator { }
// export function FromQuery(): ParameterDecorator { }
// export function FromRoute(): ParameterDecorator { }
export function HttpDelete(route?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') throw new Error('propertyKey must be a string')
    getRecordMethods(target).delete.push({ route, propertyKey })
  }
}
export function HttpGet(route?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') throw new Error('propertyKey must be a string')
    getRecordMethods(target).get.push({ route, propertyKey })
  }
}
export function HttpHead(route?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') throw new Error('propertyKey must be a string')
    getRecordMethods(target).head.push({ route, propertyKey })
  }
}
export function HttpOptions(route?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') throw new Error('propertyKey must be a string')
    getRecordMethods(target).options.push({ route, propertyKey })
  }
}
export function HttpPatch(route?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') throw new Error('propertyKey must be a string')
    getRecordMethods(target).patch.push({ route, propertyKey })
  }
}
export function HttpPost(route?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') throw new Error('propertyKey must be a string')
    getRecordMethods(target).post.push({ route, propertyKey })
  }
}
export function HttpPut(route?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') throw new Error('propertyKey must be a string')
    getRecordMethods(target).put.push({ route, propertyKey })
  }
}
// export function Route(): ClassDecorator | MethodDecorator { }
// export function AllowAnonymous(): ClassDecorator | MethodDecorator { }
// export function Authorize(): ClassDecorator | MethodDecorator { }
// #endif

//#region Class
export abstract class ControllerBase { }


/**
 * Koa 中间件
 * @param this 
 * @param ctx 
 * @param next 
 */
export function Middleware() {
  const join = (...args: string[]): string => {
    return args.map(str => str.startsWith('/') ? str : '/' + str).join('')
  }

  for (const controller of controllers) {
    const prefix = Reflect.getMetadata(MVC_CONTROLLER, controller.cls)
    const methods: RecordMethods = Reflect.getMetadata(MVC_METHOD, controller.cls)
    for (const property in methods) {
      const key = property as RequestMethod
      const arr = methods[key]
      arr.forEach(({ route, propertyKey }) => {
        const path = join(prefix, route || propertyKey)
        console.log(key, path)
        router[property as RequestMethod](join(path), (ctx: Context, next: Next) => {
          // 获取控制器示例
          const instance = controller.instance()
          // 获取控制器方法
          const fn = instance[propertyKey]
          // 调用
          return fn?.(ctx, next)
        })
      })
    }
  }
  const routers = router.routes()
  const allowedMethods = router.allowedMethods()
  const dispatch = (ctx: any, next: Next) => {
    // debugger
    return compose([routers, allowedMethods])(ctx, next)
  }
  return dispatch
}

// #endif