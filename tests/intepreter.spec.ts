import { runCode } from "./utils"

describe('Interpreter', () => {
    it('Should work with hello world', () => {
        const code = `printf("hello world")`
        runCode(code)
    })
})
