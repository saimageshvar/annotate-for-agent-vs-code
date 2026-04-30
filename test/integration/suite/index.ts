import * as path from 'path'
import Mocha from 'mocha'
import { glob } from 'glob'

export async function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'bdd', color: true, timeout: 20000 })
  const testsRoot = path.resolve(__dirname)
  const files = await glob('**/*.test.js', { cwd: testsRoot })
  for (const f of files) mocha.addFile(path.resolve(testsRoot, f))
  await new Promise<void>((res, rej) => {
    mocha.run(failures => failures > 0 ? rej(new Error(`${failures} tests failed`)) : res())
  })
}
