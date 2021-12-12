# feeny-ts

## Summary

Feeny is a small programming languages for learning how to implement dynamic languages and their runtimes.

Feeny was introduced in the U.C. Berkeley course [Virtual Machines and Managed Runtimes](http://www.wolczko.com/CS294/index.html), taught by Mario Wolczko and Patrick S. Li. Its syntax is largely inspired by another language called Stanza.

This package provides `parsing tools` and an `interpreter` written in pure `TypeScript`. We can use it in the web toolchains. Obviously, It can runs in either browser an node. Or some other JavaScript Runtime.

And we have extended the Feeny to add some syntax (`break/continue`, `closure`, etc.) and a simple type checker(and also type annitations). It too simple and not even a type system yet. But I think it will be better in the future.

And we also provides a `language service toolchains` and a `VSCode extension` that based above features. It's only supports `diagnostics` (for type check result) and `goToDefinition` yet.

The codebase is inspired by TypeScript compiler codebase. So you may can see many familiar codes if you are also familiar with TypeScript.

The VSCode extension is based on Daniel's [Feeny-VSCode](https://github.com/DanielRosenwasser/Feeny-VSCode) which a brilliant package too.

Happy hacking!

## Features

- Lexer
- Parser
    - Parsing
    - Syntax extend
        - Function expression
        - Closure
        - Break / Continue expression

- Binder
    - Symbol tables
    - Get symbol from node

- Checker
    - Type annotations
    - Basic type check
    - ~~Type system~~

- AST Interpreter
    - Feeny features
    - Closure
    - Break / Continue

- Cli
    - Run feeny files

- Language service api
    - Get diagnostics
    - GoToDefinition

- VSCode extension
    - All features in [Feeny-VSCode](https://github.com/DanielRosenwasser/Feeny-VSCode)
    - Client / Server
    - Diagnostics
    - GoToDefinition

