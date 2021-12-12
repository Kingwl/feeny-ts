import type {} from 'jest';
import { forEachCases, checkCode } from './utils';

describe('Checker', () => {
  forEachCases((baseName, content) => {
    const [result, diagnostics] = checkCode(content);
    it(`types - ${baseName}`, () => {
      expect(result).toMatchSnapshot();
    });

    it(`diagnostics - ${baseName}`, () => {
      expect(diagnostics).toMatchSnapshot();
    });
  });
});
