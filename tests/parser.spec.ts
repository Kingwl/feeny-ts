import type {} from 'jest'
import { casesPath, parseCode } from './utils'
import * as fs from 'fs'
import * as path from 'path'

describe('Parser', () => {
    const fileNames = fs.readdirSync(casesPath);

    fileNames.forEach(fileName => {
        const baseName = path.basename(fileName, '.feeny');
        const fileNamePath = path.join(casesPath, fileName);
        const content = fs.readFileSync(fileNamePath, 'utf8').toString();

        it(baseName, () => {
            const file = parseCode(content)
            expect(file).toMatchSnapshot();
        })
    })
})