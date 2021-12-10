import { createLanguageService } from '../src'

describe('Language service', () => {
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
bar.a
bar.b
`     

    const posList = [
        code.indexOf(`bar.`),
        code.indexOf(`bar.a`) + 'bar.'.length,
        code.indexOf(`bar.b`) + 'bar.'.length,
        code.indexOf(`= foo()`) + "= ".length,
    ]
    const ls = createLanguageService(code)
    posList.forEach(pos => {
        const decl = ls.goToDefinition(pos)
        it(`Definition of ${pos}`, () => {
            expect(decl?.__debugText).toMatchSnapshot()
        })
    })
})