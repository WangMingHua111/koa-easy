import "reflect-metadata";
import { IScopeService, TransientScopeService, SingletonScopeService, Lifecycle } from './utils'
import { Context, Next } from "koa";
import compose from 'koa-compose'
import Router from '@koa/router'

//#region Ioc
namespace Ioc {
  export const container = new Map<Function | String, IScopeService>()
}

/**
 * 装饰器：依赖
 * @param lifecycle 生命周期
 * @returns 
 */
export function Dependency(opts?: {
  /**
   * 注入依赖的唯一ID
   */
  uniqueId?: string
  /**
   * 生命周期
   */
  lifecycle?: Lifecycle
  /**
   * 依赖别名类型
   */
  alias?: Array<Function>
  /**
   * 为 true 时，ScopeService 立即生成 instance 实例，仅 lifecycle = 'singleton' 时有效。
   * @default false
   */
  immediate?: boolean
}): ClassDecorator {
  const { uniqueId, alias = [], lifecycle = 'singleton', immediate = false } = { ...opts }
  return function (target: Function) {
    let service: IScopeService
    switch (lifecycle) {
      case "singleton":
        service = new SingletonScopeService(target, immediate)
        break;
      case "transient":
      default:
        service = new TransientScopeService(target)
        break;
    }
    if (uniqueId) Ioc.container.set(uniqueId, service)
    alias.push(target)
    alias.forEach(func => Ioc.container.set(func, service));
  }
}

/**
 * 装饰器：依赖注入（仅支持属性注入）
 * @returns 
 */
export function Autowrite(opts?: {
  /**
   * 注入依赖的唯一ID
   */
  uniqueId: string
}): PropertyDecorator {
  const { uniqueId } = { ...opts }
  return function (target: Object, propertyKey: string | symbol) {
    const cls: Function = Reflect.getMetadata('design:type', target, propertyKey);
    Reflect.defineProperty(target, propertyKey, {
      get() {
        if (Ioc.container.has(cls)) return Ioc.container.get(cls)?.instance()
        else if (uniqueId) return Ioc.container.get(uniqueId)?.instance()
      }
    })
  }
}

//#endregion
namespace Mvc {
  export const router = new Router()
  export const MVC_CONTROLLER = 'mvc:controller'
  export const MVC_METHOD = 'mvc:method'
  export const controllers = new Set<IScopeService>()
  export const getRecordMethods = (target: Object): RecordMethods => {
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

}

//#region Mvc

type RequestMethod = 'get' | 'post' | 'put' | 'patch' | 'options' | 'head' | 'delete'
type RecordMethods = { [key in RequestMethod]: Array<{ route?: string, propertyKey: string }> }

/**
 * 控制器，控制器
 * @param route 
 * @returns 
 */
export function Controller(route?: string, lifecycle: Lifecycle = 'singleton'): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata(Mvc.MVC_CONTROLLER, route || target.name.replace(/Controller$/i, ''), target)
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
    Mvc.controllers.add(service)
  }
}
export function HttpDelete(route?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') throw new Error('propertyKey must be a string')
    Mvc.getRecordMethods(target).delete.push({ route, propertyKey })
  }
}
export function HttpGet(route?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') throw new Error('propertyKey must be a string')
    Mvc.getRecordMethods(target).get.push({ route, propertyKey })
  }
}
export function HttpHead(route?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') throw new Error('propertyKey must be a string')
    Mvc.getRecordMethods(target).head.push({ route, propertyKey })
  }
}
export function HttpOptions(route?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') throw new Error('propertyKey must be a string')
    Mvc.getRecordMethods(target).options.push({ route, propertyKey })
  }
}
export function HttpPatch(route?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') throw new Error('propertyKey must be a string')
    Mvc.getRecordMethods(target).patch.push({ route, propertyKey })
  }
}
export function HttpPost(route?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') throw new Error('propertyKey must be a string')
    Mvc.getRecordMethods(target).post.push({ route, propertyKey })
  }
}
export function HttpPut(route?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') throw new Error('propertyKey must be a string')
    Mvc.getRecordMethods(target).put.push({ route, propertyKey })
  }
}
type KoaEasyOptions = {
  logs?: boolean
}
/**
 * Koa 中间件
 * @param this 
 * @param ctx 
 * @param next 
 */
export function KoaEasy(options?: KoaEasyOptions) {
  const opts: KoaEasyOptions = {
    logs: false,
    ...options
  }
  const join = (...args: string[]): string => {
    return args.filter(str => str).map(str => str.startsWith('/') ? str : '/' + str).join('')
  }
  const isNullOrUndefined = (route: string | undefined | null) => {
    return route === undefined || route === null
  }
  const log = opts.logs ? console.log : undefined

  for (const controller of Mvc.controllers) {
    const prefix = Reflect.getMetadata(Mvc.MVC_CONTROLLER, controller.cls)
    const methods: RecordMethods = Reflect.getMetadata(Mvc.MVC_METHOD, controller.cls)
    for (const property in methods) {
      const key = property as RequestMethod
      const arr = methods[key]
      arr.forEach(({ route, propertyKey }) => {
        const path = join(prefix, isNullOrUndefined(route) ? propertyKey : route as string)
        log?.(`${property} ${path}`)
        Mvc.router[property as RequestMethod](join(path), (ctx: Context, next: Next) => {
          // 获取控制器示例
          const instance = controller.instance()
          // 获取控制器方法
          const fn = instance[propertyKey] as Function | undefined
          // 调用，通过bind设置上下文
          return fn?.bind(instance)(ctx, next)
        })
      })
    }
  }
  const routers = Mvc.router.routes()
  const allowedMethods = Mvc.router.allowedMethods()
  const dispatch = (ctx: any, next: Next) => {
    // debugger
    return compose([routers, allowedMethods])(ctx, next)
  }
  return dispatch
}
//#endregion

export default KoaEasy

