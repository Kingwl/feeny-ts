import type {} from 'jest'
import { scanCode } from './utils'

describe('Scanner', () => {
    it('Should work with integer', () => {
        const code = '1'
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with variable reference', () => {
        const code = 'x'
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with printing', () => {
        const code = 'printf (" My age is ~.\ n " , 8)'
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with arrays', () => {
        const code = 'arrays (10, 0)'
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with null', () => {
        const code = 'null'
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with object', () => {
        const code = 
`object(p):
    var x = 10
    method f():
        this.x
`
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with object with slots', () => {
        const code = 
`object(p):
    var x = 10
    method f(x, y, z):
        this.x + x + y + z
`
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with object without extends', () => {
        const code = 
`object:
    var x = 10
    method f():
        this . x
`
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with method call', () => {
        const code = 'o.f(10)'
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with slot lookup', () => {
        const code = 'o.field'
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with slot assignment', () => {
        const code = 'o.field = 42'
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with function call', () => {
        const code = 'f(10)'
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with variable assignment', () => {
        const code = 'x = 42'
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with if expression', () => {
        const code = 
`if x:
    printf("A")
else:
    printf("B")
`
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with if expression with only if', () => {
        const code = 
`if x:
    printf("A")
`
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with while expression', () => {
        const code = 
`while x:
    x = x + y
`
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with local variable', () => {
        const code = 'var x = 42'
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with statement sequences', () => {
        const code = '( s1, s2, s3 )'
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with local expression', () => {
        const code = 'f(x)'
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with global variable', () => {
        const code = 'var x = 42'
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with function', () => {
        const code =
`
defn f(x, y, z ):
    x + y
`
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })

    it('Should work with top level expression', () => {
        const code = 'f(x)'
        const tokens = scanCode(code);
        expect(tokens).toMatchSnapshot();
    })
})