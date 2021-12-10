import { createLanguageService } from '../src'

describe('Language service', () => {
    it("Should work", () => {
        const code = 
`
defn foo():
    object:
        var a = 1
        var b = 2
var bar = foo()
bar.a
`       
        const ls = createLanguageService(code)
        const pos = code.indexOf(`var b = 2`) + 'var '.length
        const char = code[pos]
        console.log(char);
        const token = ls.getCurrentToken(pos)
        console.log(token)
    })
})