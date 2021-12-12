import type {} from 'jest';
import { forEachCases, scanCode } from './utils';

describe('Scanner', () => {
  forEachCases((baseName, content) => {
    it(baseName, () => {
      const tokens = scanCode(content);
      expect(tokens).toMatchSnapshot();
    });
  });
});
