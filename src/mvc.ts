import "reflect-metadata";

const TKEY = 'design:type'
const PKEY = 'design:paramtypes'
const RKEY = 'design:returntype'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'DELETE'


const controllers = new Set<Function>()
const paths: Record<RequestMethod, any> = {
  'GET': {},
  'POST': {},
  'PUT': {},
  'PATCH': {},
  'OPTIONS': {},
  'HEAD': {},
  'DELETE': {}
}
//#region Decorators
/**
 * 控制器，控制器
 * @param route 
 * @returns 
 */
export function Controller(route?: string): ClassDecorator {
  return function (target: Function) {
    controllers.add(target)
  }
}
// export function FromBody(): ParameterDecorator { }
// export function FromForm(): ParameterDecorator { }
// export function FromHeader(): ParameterDecorator { }
// export function FromQuery(): ParameterDecorator { }
// export function FromRoute(): ParameterDecorator { }
// export function HttpDelete(): MethodDecorator { }
export function HttpGet(route?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
    // Reflect.defineMetadata('', '', target)
    // Reflect.getMetadata(TKEY, target, propertyKey)
    // console.log(Reflect.getMetadataKeys(target))
    // paths.GET.set(target)
    return descriptor
  }
}
// export function HttpHead(): MethodDecorator { }
// export function HttpOptions(): MethodDecorator { }
// export function HttpPatch(): MethodDecorator { }
// export function HttpPost(): MethodDecorator { }
// export function HttpPut(): MethodDecorator { }
// export function Route(): ClassDecorator | MethodDecorator { }
// export function AllowAnonymous(): ClassDecorator | MethodDecorator { }
// export function Authorize(): ClassDecorator | MethodDecorator { }
// #endif

//#region Class
export abstract class ControllerBase {}

// #endif

// export s from ''