import * as fs from 'fs';
import * as path from 'path';
import { createParser, createInterpreter } from './index';

function main() {
  if (process.argv.length < 3) {
    console.error('Input missing.');
    return;
  }

  const file = process.argv[2];
  if (!file) {
    console.error(`Invalid input '${file}'.`);
    return;
  }

  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    console.error(`File '${filePath}' not existed.`);
    return;
  }

  const content = fs.readFileSync(filePath).toString();
  if (!content) {
    console.error(`File '${filePath}' is empty.`);
    return;
  }

  const parser = createParser(content);
  const sourceFile = parser.parseSourceFile();
  const interpreter = createInterpreter(sourceFile);
  interpreter.evaluate();
}

main();
