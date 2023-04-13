import { describe, expect, test } from '@jest/globals';
import { Dependency, Autowrite } from '../src/index';

describe('test ioc', () => {
  const uniqueId = 'x2'
  interface ITest {
    log(): number
  }

  @Dependency({ uniqueId })
  class Test implements ITest {
    log(): number { return 1 }
  }

  class Inject {
    @Autowrite()
    readonly t!: Test
    @Autowrite({ uniqueId })
    readonly t1!: ITest
  }
  test('验证属性 Autowrite', () => {
    const i = new Inject()
    expect(i.t.log()).toBe(1)
  });
  test('验证属性 Autowrite by UniqueId', () => {
    const i = new Inject()
    debugger
    expect(i.t1.log()).toBe(1)
  });
});