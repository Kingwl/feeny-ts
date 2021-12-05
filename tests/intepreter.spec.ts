import { casesPath, runCode, runWithConsoleLogHook } from "./utils"
import * as fs from 'fs'
import * as path from 'path'

describe('Interpreter', () => {
    it('Should work with hello world', () => {
        const code = `printf("hello world")`
        const stdout = runWithConsoleLogHook(() => {
            runCode(code)
        })
        expect(stdout).toMatchSnapshot();
    })

    const fileNames = fs.readdirSync(casesPath);

    fileNames.forEach(fileName => {
        const baseName = path.basename(fileName, '.feeny');
        const fileNamePath = path.join(casesPath, fileName);
        const content = fs.readFileSync(fileNamePath, 'utf8').toString();

        it(baseName, () => {
            const stdout = runWithConsoleLogHook(() => {
                runCode(content)
            })
            expect(stdout).toMatchSnapshot();
        })
    })
})
