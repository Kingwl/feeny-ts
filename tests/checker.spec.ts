import type {} from 'jest'
import { forEachCases, checkCode } from './utils'

describe('Checker', () => {
    it('Should work', () => {
        const code = `
        var arr: array(integer) = array(1, 2)
`
        const result = checkCode(code)
        expect(result).toMatchSnapshot()
    })
})