import { createLanguageService } from '../src';

describe('Language service', () => {
  const code = `
defn foo():
    object:
        var a = 1
        var b = 2
var bar = foo()
bar.a
bar.b
`;

  const posList = [
    code.indexOf(`bar.`),
    code.indexOf(`bar.a`) + 'bar.'.length,
    code.indexOf(`bar.b`) + 'bar.'.length,
    code.indexOf(`= foo()`) + '= '.length
  ];
  const ls = createLanguageService(code);
  posList.forEach(pos => {
    const decl = ls.goToDefinition(pos);
    it(`Definition of ${pos}`, () => {
      expect(decl?.__debugText).toMatchSnapshot();
    });
  });
});

describe('Language service 1', () => {
  const code = `
var bar = object:
    var a = 1
    var b = 2
bar.a
bar.b
`;

  const posList = [
    code.indexOf(`bar.`),
    code.indexOf(`bar.a`) + 'bar.'.length,
    code.indexOf(`bar.b`) + 'bar.'.length
  ];
  const ls = createLanguageService(code);
  posList.forEach(pos => {
    const decl = ls.goToDefinition(pos);
    it(`Definition of ${pos}`, () => {
      expect(decl?.__debugText).toMatchSnapshot();
    });
  });
});

describe('Language service 2', () => {
  const code = `
var bar = object:
    var a = 1
    var b = object:
        var c = 2
bar.a
bar.b
bar.b.c
`;

  const posList = [
    code.indexOf(`bar.`),
    code.indexOf(`bar.a`) + 'bar.'.length,
    code.indexOf(`bar.b`) + 'bar.'.length,
    code.indexOf(`bar.b.c`) + 'bar.b.'.length
  ];
  const ls = createLanguageService(code);
  posList.forEach(pos => {
    const decl = ls.goToDefinition(pos);
    it(`Definition of ${pos}`, () => {
      expect(decl?.__debugText).toMatchSnapshot();
    });
  });
});

describe('Language service 3', () => {
  const code = `
var bar = object:
    var a = 1
    var b = object:
        var c = 2

var baz = object(bar):
    var c = 2

baz.a
baz.b
baz.b.c
baz.c
`;

  const posList = [
    code.indexOf(`baz.`),
    code.indexOf(`baz.a`) + 'baz.'.length,
    code.indexOf(`baz.b`) + 'baz.'.length,
    code.indexOf(`baz.b.c`) + 'baz.b.'.length,
    code.indexOf(`baz.c`) + 'baz.'.length
  ];
  const ls = createLanguageService(code);
  posList.forEach(pos => {
    const decl = ls.goToDefinition(pos);
    it(`Definition of ${pos}`, () => {
      expect(decl?.__debugText).toMatchSnapshot();
    });
  });
});
