import esbuild from 'esbuild'

const watch = process.argv.includes('--watch')

const extensionConfig = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  logLevel: 'info',
}

const webviewListConfig = {
  entryPoints: ['src/views/webview/list/main.ts'],
  bundle: true,
  outfile: 'dist/webview/list/main.js',
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  sourcemap: true,
  logLevel: 'info',
}

const webviewEditorConfig = {
  entryPoints: ['src/views/webview/editor/main.ts'],
  bundle: true,
  outfile: 'dist/webview/editor/main.js',
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  sourcemap: true,
  logLevel: 'info',
}

const configs = [extensionConfig, webviewListConfig, webviewEditorConfig]

if (watch) {
  for (const c of configs) {
    const ctx = await esbuild.context(c)
    await ctx.watch()
  }
} else {
  await Promise.all(configs.map(c => esbuild.build(c)))
}
