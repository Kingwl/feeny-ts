import type {} from 'jest';
import { forEachCases, parseCode } from './utils';

describe('Parser', () => {
  forEachCases((baseName, content) => {
    it(baseName, () => {
      const file = parseCode(content);
      expect(file).toMatchSnapshot();
    });
  });
});
