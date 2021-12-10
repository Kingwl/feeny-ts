import { createLanguageService } from '../src'

describe('Language service', () => {
    it("Should work", () => {
        const code = 
`
typedef ab:
    var a: integer
    var b: integer

defn foo() -> ab:
    object:
        var a = 1
        var b = 2
var bar = foo()
bar.b
`       
        const ls = createLanguageService(code)
        const pos = code.indexOf(`bar.b`) + 'bar.'.length
        const char = code[pos]
        const token = ls.getCurrentToken(pos)
        const decl = ls.goToDefinition(pos)
        if (decl?.pos) {
            console.log(decl.pos, code.substring(decl.pos, decl.end))
        }
    })
})