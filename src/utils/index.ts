export interface IScopeService {
  readonly cls: Function;
  instance(): any
}

export class TransientScopeService implements IScopeService {
  cls: Function
  constructor(cls: Function) {
    this.cls = cls
  }
  instance() {
    return Reflect.construct(this.cls, [])
  }
}
export class SingletonScopeService implements IScopeService {
  cls: Function
  ins: any
  constructor(cls: Function, immediate = false) {
    this.cls = cls
    // 立即生成实例
    if (immediate) this.instance()
  }
  instance() {
    if (!this.ins) this.ins = Reflect.construct(this.cls, [])
    return this.ins
  }
}

/**
 * 依赖生命周期
 */
export type Lifecycle = 'transient' | 'singleton'