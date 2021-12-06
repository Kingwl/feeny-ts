import { forEachDemo, parseCode, runCode, runWithConsoleLogHook, scanCode } from './utils'

describe('Should work with demo', () => {

    forEachDemo((baseName, content) => {
        it(`Scanner - should work with ${baseName}`, () => {
            const tokens = scanCode(content)
            expect(tokens).toMatchSnapshot();
        })

        it(`Parser - should work with ${baseName}`, () => {
            const file = parseCode(content)
            expect(file).toMatchSnapshot();
        })

        it(`Interpreter - should work with ${baseName}`, () => {
            const output = runWithConsoleLogHook(() => {
                runCode(content)
            });
            expect(output).toMatchSnapshot();
        })
    })
})