import type {} from 'jest'
import { forEachCases, checkCode } from './utils'

describe('Parser', () => {
    it('Should work', () => {
        const code = `
        array(1, 2)
`
        const result = checkCode(code)
        expect(result).toMatchSnapshot()
    })
})