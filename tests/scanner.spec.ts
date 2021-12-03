import type {} from 'jest'
import { scanCode } from './utils'

describe('Scanner', () => {
    it('Should work with integer', () => {
        const code = '1'
        const tokens = scanCode(code);
        expect(tokens.length).toBe(2);
    })
})