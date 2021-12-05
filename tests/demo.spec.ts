import { forEachDemo, parseCode, scanCode } from './utils'

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
    })
})