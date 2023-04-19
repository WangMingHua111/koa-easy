import "reflect-metadata";

const TKEY = 'design:type'
const PKEY = 'design:paramtypes'
const RKEY = 'design:returntype'

interface IScopeService {
  readonly cls: Function;
  instance(): any
}

class TransientScopeService implements IScopeService {
  cls: Function
  constructor(cls: Function) {
    this.cls = cls
  }
  instance() {
    return Reflect.construct(this.cls, [])
  }
}
class SingletonScopeService implements IScopeService {
  cls: Function
  ins: any
  constructor(cls: Function) {
    this.cls = cls
  }
  instance() {
    if (!this.ins) this.ins = Reflect.construct(this.cls, [])
    return this.ins
  }
}
const container = new Map<Function | String, IScopeService>()

/**
 * 依赖生命周期
 */
export type Lifecycle = 'transient' | 'singleton'

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
    const cls: Function = Reflect.getMetadata(TKEY, target);
    console.log('cls2', cls)
    Reflect.defineProperty(target, propertyKey, {
      get() {
        if (container.has(cls)) return container.get(cls)?.instance()
        else if (uniqueId) return container.get(uniqueId)?.instance()
      }
    })
  }
}