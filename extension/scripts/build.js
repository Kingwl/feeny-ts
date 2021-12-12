const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
    entryPoints: [
        path.resolve(__dirname, '../src/server.ts'),
        path.resolve(__dirname, '../src/client.ts')
    ],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outdir: path.resolve(__dirname, '../dist'),
    external: [
        'vscode'
    ]
})