import "reflect-metadata";
import { IScopeService, TransientScopeService, SingletonScopeService, Lifecycle } from './utils'
import { Context, Next } from "koa";
import compose from 'koa-compose'
import Router from '@koa/router'
import { bodyParser } from '@koa/bodyparser'
// 导出所有服务
export * from './services/cache-service'

//#region Ioc
namespace Ioc {
  export const container = new Map<Function | String, IScopeService>()
}
export type DependencyOptions = {
  /**
   * 注入依赖的唯一ID
   */
  uniqueId?: string
  /**
   * 生命周期
   * @default 'singleton''
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
}

/**
 * 装饰器：依赖
 * @param lifecycle 生命周期
 * @returns 
 */
export function Dependency(opts?: DependencyOptions): ClassDecorator {
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
 * 添加依赖
 */
export function AddDependency(dep: Object, opts?: Pick<DependencyOptions, 'uniqueId' | 'alias'>) {
  const { uniqueId, alias = [] } = { ...opts }
  const target: Function = dep.constructor
  // 创建一个单例服务
  let service = new SingletonScopeService(target)
  // 直接设置实例，不再有 SingletonScopeService 自动创建
  service.ins = dep
  if (uniqueId) Ioc.container.set(uniqueId, service)
  alias.push(target)
  alias.forEach(func => Ioc.container.set(func, service));
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
  export const MVC_PARAMETER = 'mvc:parameter'
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
 * @param lifecycle 默认值：transient
 * @returns 
 */
export function Controller(route?: string, lifecycle: Lifecycle = 'transient'): ClassDecorator {
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

/**
 * 参数转换器
 */
export abstract class ParameterConverter {
  abstract cast(value: string | string[] | undefined): any
}
/**
 * 字符串参数转换器，这是默认转换器
 */
export class StringParameterConverter extends ParameterConverter {
  cast(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) {
      return value[0]
    } else if (typeof value === 'string' && value !== '') {
      return value
    } else {
      return undefined
    }
  }
}
/**
 * 字符串数组参数转换器
 */
export class StringArrayParameterConverter extends ParameterConverter {
  cast(value: string | string[] | undefined): string[] {
    if (Array.isArray(value)) {
      return value
    } else if (typeof value === 'string' && value !== '') {
      return [value]
    } else {
      return []
    }
  }
}
/**
 * 数值参数转换器
 */
export class NumberParameterConverter extends ParameterConverter {
  cast(value: string | string[] | undefined): number | undefined {
    if (Array.isArray(value)) {
      return value.length === 0 ? undefined : Number(value[0])
    } else if (typeof value === 'string' && value !== '') {
      return Number(value)
    } else {
      return undefined
    }
  }
}
/**
 * 数值参数数组转换器
 */
export class NumberArrayParameterConverter extends ParameterConverter {
  cast(value: string | string[] | undefined): number[] {
    if (Array.isArray(value)) {
      return value.map(val => Number(val))
    } else if (typeof value === 'string' && value !== '') {
      return [Number(value)]
    } else {
      return []
    }
  }
}
/**
 * 布尔值参数转换器
 */
export class BooleanParameterConverter extends ParameterConverter {
  cast(value: string | string[] | undefined): boolean | undefined {
    if (Array.isArray(value)) {
      if (value.length === 0) return false
      else {
        return value[0] === '' || value[0] === '0' ? false : true
      }
    } else if (typeof value === 'string') {
      return value === '' || value === '0' ? false : true
    } else {
      return undefined
    }
  }
}

/**
 * 布尔值数组参数转换器
 */
export class BooleanArrayParameterConverter extends ParameterConverter {
  cast(value: string | string[] | undefined): boolean[] {
    if (Array.isArray(value)) {
      return value.map(val => val === '' || val === '0' ? false : true)
    } else if (typeof value === 'string') {
      return [value === '' || value === '0' ? false : true]
    } else {
      return []
    }
  }
}
export type ParameterConverterFn = (ctx: Context, next: Next) => Promise<any> | any
/**
 * 参数转换类型
 */
export type ParameterConverterType = ParameterConverter | 'str' | 'strs' | 'num' | 'nums' | 'boolean' | 'booleans'

/**
 * bodyParser 参数
 * @link https://github.com/koajs/bodyparser/tree/master#options
 */
export type BodyParserOptions = Omit<Exclude<Parameters<typeof bodyParser>[0], undefined>, 'encoding'> & { encoding?: string }
/**
 * 从查询参数中读取
 * @returns 
 */
export function FromQuery(name: string, converter: ParameterConverterType = 'str'): ParameterDecorator {

  return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
    const metakey = `${Mvc.MVC_PARAMETER}:${String(propertyKey)}`
    const metadata: Record<number, ParameterConverterFn> = Reflect.getMetadata(metakey, target.constructor) || {}

    metadata[parameterIndex] = (ctx: Context) => {
      let conv: ParameterConverter
      switch (converter) {
        case 'strs':
          conv = new StringArrayParameterConverter()
          break;
        case 'num':
          conv = new NumberParameterConverter()
          break;
        case 'nums':
          conv = new NumberArrayParameterConverter()
          break;
        case 'boolean':
          conv = new BooleanParameterConverter()
          break;
        case 'booleans':
          conv = new BooleanArrayParameterConverter()
          break;
        case 'str':
          conv = new StringParameterConverter()
          break;
        default:
          conv = converter
          break;
      }
      return conv.cast(ctx.query[name])
    }
    Reflect.defineMetadata(metakey, metadata, target.constructor)
  }
}

/**
 * 从路径参数中读取
 * @returns 
 */
export function FromRoute(name: string, converter: Extract<ParameterConverterType, 'str' | 'num'> = 'str'): ParameterDecorator {

  return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
    const metakey = `${Mvc.MVC_PARAMETER}:${String(propertyKey)}`
    const metadata: Record<number, ParameterConverterFn> = Reflect.getMetadata(metakey, target.constructor) || {}

    metadata[parameterIndex] = async (ctx: Context) => {
      let conv: ParameterConverter
      switch (converter) {
        case 'num':
          conv = new NumberParameterConverter()
          break;
        case 'str':
        default:
          conv = new StringParameterConverter()
          break;
      }
      return conv.cast(ctx.params[name])
    }
    Reflect.defineMetadata(metakey, metadata, target.constructor)
  }
}

/**
 * 从body中读取
 * @param options 参数
 * @link https://github.com/koajs/bodyparser/tree/master#options
 * @returns 
 */
export function FromBody(options?: BodyParserOptions): ParameterDecorator {
  return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
    const metakey = `${Mvc.MVC_PARAMETER}:${String(propertyKey)}`
    const metadata: Record<number, ParameterConverterFn> = Reflect.getMetadata(metakey, target.constructor) || {}
    metadata[parameterIndex] = async (ctx: Context, next: Next) => {
      await bodyParser(options as any)(ctx, next)
      return ctx.request.body
    }
    Reflect.defineMetadata(metakey, metadata, target.constructor)
  }
}

type KoaEasyOptions = {
  logs?: boolean
}
/**
 * 内部的Http便捷方法
 */
class InnerHttp {
  public ctx: Context
  constructor(ctx: Context) {
    this.ctx = ctx
  }
  public ok(data?: any): void {
    this.ctx.response.status = 200
    this.ctx.response.body = data
  }
  public bad(data?: any): void {
    this.custom(400, data)
  }
  public unauthorized(data?: any) {
    this.custom(401, data)
  }
  public forbidden(data?: any) {
    this.custom(403, data)
  }
  public custom(status: number, data?: any) {
    this.ctx.response.status = status
    if (data !== undefined) this.ctx.response.body = data
  }
  // todo 401 403 500 等
}
/**
 * BaseController
 */
export abstract class BaseController {
  private _http!: InnerHttp

  get http() {
    return this._http
  }


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
        const parameters: Record<number, ParameterConverterFn> = Reflect.getMetadata(`${Mvc.MVC_PARAMETER}:${propertyKey}`, controller.cls) || {}
        const path = join(prefix, isNullOrUndefined(route) ? propertyKey : route as string)
        log?.(`${property} ${path}`)
        Mvc.router[property as RequestMethod](join(path), async (ctx: Context, next: Next) => {
          // 获取控制器示例
          const instance = controller.instance()
          // 获取控制器方法
          const fn = instance[propertyKey] as Function | undefined
          // 设置默认参数
          const args = [ctx, next]
          for (const key of Object.keys(parameters)) {
            const index = Number(key)
            let value
            const result = parameters[key](ctx, next)
            if (result instanceof Promise) {
              value = await result
            } else {
              value = result
            }
            args.splice(index, 1, value)
          }
          // 尽量使用瞬态实例，避免上下文混乱
          if (instance instanceof BaseController) {
            Object.assign(instance, { _http: new InnerHttp(ctx) })
          }
          // 调用，通过bind设置上下文
          return fn?.apply(instance, args)
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

