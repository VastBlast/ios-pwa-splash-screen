import { defineConfig } from 'tsdown';

export default defineConfig([{
    entry: ['./src/index.ts'],
    platform: 'browser',
    name: 'IosPwaSplashScreen',
    globalName: 'IosPwaSplashScreen',
    dts: true,
    minify: true,
    treeshake: true,
    clean: true,
    shims: true,
    format: ['cjs', 'esm', 'umd'],
    sourcemap: true
}]);