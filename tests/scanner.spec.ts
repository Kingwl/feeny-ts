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
})