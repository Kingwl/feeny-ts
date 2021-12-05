import { runCode } from "./utils"

describe('Intepreter', () => {
    it('Should work', () => {
        const code = `printf("hello world")`
        runCode(code)
    })
})
