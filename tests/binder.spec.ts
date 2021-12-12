import { forEachCases, bindCode } from './utils';

describe('Binder', () => {
  forEachCases((baseName, content) => {
    const { localsResult, membersResult } = bindCode(content);

    it(`${baseName} - locals`, () => {
      expect(localsResult).toMatchSnapshot();
    });

    it(`${baseName} - members`, () => {
      expect(membersResult).toMatchSnapshot();
    });
  });
});
