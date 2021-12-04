import { parseCode, scanCode } from './utils'
import * as path from 'path'
import * as fs from 'fs'

const demoPath = path.resolve(__dirname, 'demo');

describe('Should work with demo', () => {

    const fileNames = fs.readdirSync(demoPath);

    fileNames.filter(x => x.startsWith('vector')).forEach(fileName => {
        const baseName = path.basename(fileName, '.feeny');
        const fileNamePath = path.join(demoPath, fileName);
        const content = fs.readFileSync(fileNamePath, 'utf8').toString();

        it(`Scanner - should work with ${baseName}`, () => {
            const tokens = scanCode(content)
            expect(tokens).toMatchSnapshot();
        })

        it(`Parser - should work with ${baseName}`, () => {
            const file = parseCode(content)
            expect(file).toMatchSnapshot();
        })
    })
})