import { forEachDemo, parseCode, runWithStdoutHook, scanCode } from './utils'

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
            const output = runWithStdoutHook(content);
            expect(output).toMatchSnapshot();
        })
    })
})