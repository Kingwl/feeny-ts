import { runCode } from "./utils"

describe('Interpreter', () => {
    it('Should work', () => {
        const code = `printf("hello world")`
        runCode(code)
    })
})
