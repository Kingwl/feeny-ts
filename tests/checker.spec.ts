import type {} from 'jest'
import { forEachCases, checkCode } from './utils'

describe('Checker', () => {
    forEachCases((baseName, content) => {
        it(baseName, () => {
            const result = checkCode(content)
            expect(result).toMatchSnapshot()
        })
    })
})