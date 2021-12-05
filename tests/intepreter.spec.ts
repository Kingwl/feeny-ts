import { forEachCases, runCode, runWithConsoleLogHook } from "./utils"

describe('Interpreter', () => {
    it('Should work with hello world', () => {
        const code = `printf("hello world")`
        const stdout = runWithConsoleLogHook(() => {
            runCode(code)
        })
        expect(stdout).toMatchSnapshot();
    })

    forEachCases((baseName, content) => {
        it(baseName, () => {
            const stdout = runWithConsoleLogHook(() => {
                runCode(content)
            })
            expect(stdout).toMatchSnapshot();
        })
    })
})
