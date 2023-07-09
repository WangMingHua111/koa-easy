import { defineConfig } from 'rollup';
import babel from 'rollup-plugin-babel';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

// import pkg from './package.json';
// import { camelCase } from 'lodash'

// 拿到package.json的name属性来动态设置打包名称
const libName = 'index';
export default defineConfig({
  input: 'src/index.ts',
  output: [
    {
      file: `dist/${libName}.cjs.js`,
      // commonjs格式
      exports: 'named',
      format: 'cjs',
    },
    {
      file: `dist/${libName}.es.js`,
      // es module
      exports: 'named',
      format: 'es',
    }
  ],
  external: ['@koa/bodyparser', '@koa/router', 'koa', 'koa-compose'],
  plugins: [
    json(),
    commonjs(),
    babel(),
    typescript({
      module: 'es2020',
      sourceMap: false,
      compilerOptions: {
        paths: {
          '@/*': ['./src/*'],
        },
        declaration: false,
      },
    }),

    resolve(),
  ],
});