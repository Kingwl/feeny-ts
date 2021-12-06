const esbuild = require('esbuild');

esbuild.build({
    entryPoints: [
        './src/index.ts'
    ],
    bundle: true,
    format: 'cjs',
    sourcemap: true,
    outdir: './dist',
})

esbuild.build({
    entryPoints: [
        './src/bin.ts'
    ],
    bundle: true,
    format: 'cjs',
    sourcemap: true,
    outdir: './dist',
    platform: 'node'
})
