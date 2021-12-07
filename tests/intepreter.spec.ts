import { forEachCases, runWithStdoutHook } from "./utils"

describe('Interpreter', () => {
    it('Should work with hello world', () => {
        const code = `printf("hello world")`
        const stdout = runWithStdoutHook(code)
        expect(stdout).toMatchSnapshot();
    })

    forEachCases((baseName, content) => {
        it(baseName, () => {
            const stdout = runWithStdoutHook(content);
            expect(stdout).toMatchSnapshot();
        })
    })
})
