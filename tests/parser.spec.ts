import type {} from 'jest'
import { parseCode } from './utils'

describe('Parser', () => {
    it('Should work with integer', () => {
        const code = '1'
        const file = parseCode(code);
        expect(file).toMatchSnapshot();
    })

    it('Should work with variable reference', () => {
        const code = 'x'
        const file = parseCode(code);
        expect(file).toMatchSnapshot();
    })

    it('Should work with printing', () => {
        const code = 'printf (" My age is ~.\ n " , 8)'
        const file = parseCode(code);
        expect(file).toMatchSnapshot();
    })

    it('Should work with arrays', () => {
        const code = 'arrays (10, 0)'
        const file = parseCode(code);
        expect(file).toMatchSnapshot();
    })

    it('Should work with null', () => {
        const code = 'null'
        const file = parseCode(code);
        expect(file).toMatchSnapshot();
    })

    it('Should work with object', () => {
        const code = 
`object(p):
    var x = 10
`
        const file = parseCode(code);
        expect(file).toMatchSnapshot();
    })

    it('Should work with object with slots', () => {
        const code = 
`object(p):
    var x = 10
`
        const file = parseCode(code);
        expect(file).toMatchSnapshot();
    })

    it('Should work with object without extends', () => {
        const code = 
`object:
    var x = 10
`
        const file = parseCode(code);
        expect(file).toMatchSnapshot();
    })

    it('Should work with statement sequences', () => {
        const code = '( s1, s2, s3 )'
        const file = parseCode(code);
        expect(file).toMatchSnapshot();
    })


    it('Should work with function', () => {
        const code =
`
defn f(x, y, z ):
    null
`
        const file = parseCode(code);
        expect(file).toMatchSnapshot();
    })

    it('Should work with method slot', () => {
        const code = 
`object(p):
    var x = 10
    method f():
        this.x
`
        const file = parseCode(code);
        expect(file).toMatchSnapshot();
    })

    it('Should work with arguments', () => {
        const code = 
`object(p):
    var x = 10
    method f(x, y, z):
        this.x + x + y + z
`
        const file = parseCode(code);
        expect(file).toMatchSnapshot();
    })
})