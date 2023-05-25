import "reflect-metadata";
import { IScopeService, TransientScopeService, SingletonScopeService, Lifecycle } from './utils'

const TKEY = 'design:type'
const PKEY = 'design:paramtypes'
const RKEY = 'design:returntype'

const container = new Map<Function | String, IScopeService>()

/**
 * 装饰器：依赖
 * @param lifecycle 生命周期
 * @returns 
 */
export function Dependency(opts?: {
  /**
   * 注入依赖的唯一ID
   */
  uniqueId?: string,
  /**
   * 生命周期
   */
  lifecycle?: Lifecycle
  /**
   * 依赖别名类型
   */
  alias?: Array<Function>
}): ClassDecorator {
  const { uniqueId, alias = [], lifecycle = 'singleton' } = { ...opts }
  return function (target: Function) {
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
    if (uniqueId) container.set(uniqueId, service)
    alias.push(target)
    alias.forEach(func => container.set(func, service));
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
    const cls: Function = Reflect.getMetadata(TKEY, target, propertyKey);
    Reflect.defineProperty(target, propertyKey, {
      get() {
        if (container.has(cls)) return container.get(cls)?.instance()
        else if (uniqueId) return container.get(uniqueId)?.instance()
      }
    })
  }
}