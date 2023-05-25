// import { describe, expect, test } from 'vitest';
import { describe, expect, test } from "@jest/globals";
import Koa from "koa";
import ip from "ip";
import {
  Middleware,
  Dependency,
  Autowrite,
  ControllerBase,
  Controller,
  HttpGet,
} from "../src";

// describe("test ioc", () => {
//   const uniqueId = "x2";
//   interface ITest {
//     log(): number;
//   }

//   @Dependency({ uniqueId })
//   class Test implements ITest {
//     log(): number {
//       return 1;
//     }
//   }

//   class Inject {
//     @Autowrite()
//     readonly t!: Test;
//     @Autowrite({ uniqueId })
//     readonly t1!: ITest;
//     public st() {
//       console.log(123);
//     }
//   }
//   test("验证属性 Autowrite", () => {
//     const i = new Inject();
//     expect(i.t.log()).toBe(1);
//   });
//   test("验证属性 Autowrite by UniqueId", () => {
//     const i = new Inject();
//     expect(i.t1.log()).toBe(1);
//   });
// });

describe("test mvc", () => {
  @Controller("test")
  class TestController extends ControllerBase {
    @HttpGet("g1")
    public g1(ctx) {
      ctx.body = `date:${new Date().toLocaleTimeString()}`
      // return `date:${new Date().toLocaleTimeString()}`;
    }
  }

  const app = new Koa();
  app.use(Middleware())
  const server = app.listen(3000);
  console.log(`服务启动成功`);
  console.log(`http://${ip.loopback()}:${3000}`);
  console.log(`http://${ip.address()}:${3000}`);

  test("读取Get请求", async () => {
    const {status} = await fetch("http://localhost:3000/test/g1");
    console.log(status)
    // const d = await fetch('https://test.wangminghua.com/url.txt')
    // console.log(d.text())
  });
});
