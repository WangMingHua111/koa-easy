// import { describe, expect, test } from 'vitest';
import { describe, expect, test } from "@jest/globals";
import Koa from "koa";
import ip from "ip";
import {
  KoaEasy,
  Autowrite,
  Controller,
  HttpGet,
  AddDependency,
  ICacheService,
  MemoryCacheService
} from "../src";
const delay = (time) => new Promise(r => setTimeout(r, time))
describe("test ioc", () => {
  const uniqueId = "x2";
  AddDependency(new MemoryCacheService(), { uniqueId })
  class Inject {
    @Autowrite()
    readonly t!: MemoryCacheService;
    @Autowrite({ uniqueId })
    readonly t1!: ICacheService;
  }
  test("验证属性 Autowrite", async () => {
    const i = new Inject();
    const r = await i.t.get('xxx1', async () => 1)
    const r2 = await i.t1.get('xxx1')
    expect(r).toBe(1);
    expect(r2).toBe(1);
  });
});

// describe("test services", () => {
//   const cacheService = new MemoryCacheService({ scannerInterval: 15 })
//   test("缓存服务测试", async () => {
//     await cacheService.set('k1', 1)
//     const result = await cacheService.get<number>('k1')
//     if (result !== 1) throw new Error()
//     await cacheService.get('k2', async () => 2, { type: 'absolute', "expired": 5 })
//     const result2 = await cacheService.get('k2')
//     if (result2 === undefined) throw new Error()
//     await delay(6000)
//     const result3 = await cacheService.get('k2')

//     if (result3 !== undefined) throw new Error()
//     cacheService.destroy()
//   }, 10 * 1000);
// });

describe("test mvc", () => {
  @Controller("test")
  class TestController {
    @HttpGet("g1")
    public g1(ctx) {
      ctx.body = `date:${new Date().toLocaleTimeString()}`
      // return `date:${new Date().toLocaleTimeString()}`;
    }
  }

  const app = new Koa();
  app.use(KoaEasy())
  const server = app.listen(3000);
  console.log(`服务启动成功`);
  console.log(`http://${ip.loopback()}:${3000}`);
  console.log(`http://${ip.address()}:${3000}`);

  test("读取Get请求", async () => {
    const { status } = await fetch("http://localhost:3000/test/g1");
    console.log(status)
    // const d = await fetch('https://test.wangminghua.com/url.txt')
    // console.log(d.text())
  });
});
