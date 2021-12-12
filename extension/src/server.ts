import {
    createConnection,
    TextDocuments,
    DiagnosticSeverity,
    ProposedFeatures,
    InitializeParams,
    TextDocumentSyncKind,
    InitializeResult,
    Range
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { createLanguageService, TextSpan } from 'feeny-ts'

let connection = createConnection(ProposedFeatures.all);

let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full,
            definitionProvider: true,
        }
    };
    return result;
});

let server: ReturnType<typeof createLanguageService> | undefined

function textSpanToRange (doc: TextDocument, span: TextSpan) {
    const startPosition = doc.positionAt(span.pos)
    const endPosition = doc.positionAt(span.end)

    return Range.create(
        startPosition,
        endPosition
    )
}

function createLsForDoc (doc: TextDocument) {
    server = createLanguageService(doc.getText())
    const diagnostics = server.getDiagnostics()
    connection.sendDiagnostics({
        uri: doc.uri,
        diagnostics: diagnostics.map(d => {
            return {
                range: textSpanToRange(doc, d.span),
                severity: DiagnosticSeverity.Error,
                message: d.message
            }
        })
    })
}

documents.onDidOpen(doc => {
    createLsForDoc(doc.document)
})

documents.onDidChangeContent(change => {
    createLsForDoc(change.document)
})

connection.onDidChangeWatchedFiles(_change => {
    connection.console.log('We received a file change event');
});

connection.onDefinition(async (params) => {
    if (!server) {
        return undefined;
    }

    const uri = params.textDocument.uri;
    const doc = documents.get(uri);
    const pos = doc.offsetAt(params.position);
    const result = server.goToDefinition(pos);
    if (!result) {
        return undefined;
    }

    const range = textSpanToRange(doc, result)
    result.pos
    return [
        {
            uri,
            range
        }
    ];
})

documents.listen(connection);

connection.listen();
