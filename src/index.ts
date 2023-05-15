import { Context, Next } from "koa";
export * from "./ioc";
export * from "./mvc";

async function Launcher(this:Context ,ctx: Context, next: Next) {
    console.log(this)
    // ctx
    await next()
}

export default Launcher;
