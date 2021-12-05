import type {} from 'jest'
import { casesPath, scanCode } from './utils'
import * as fs from 'fs'
import * as path from 'path'

describe('Scanner', () => {
    const fileNames = fs.readdirSync(casesPath);

    fileNames.forEach(fileName => {
        const baseName = path.basename(fileName, '.feeny');
        const fileNamePath = path.join(casesPath, fileName);
        const content = fs.readFileSync(fileNamePath, 'utf8').toString();

        it(baseName, () => {
            const tokens = scanCode(content)
            expect(tokens).toMatchSnapshot();
        })
    })
})
