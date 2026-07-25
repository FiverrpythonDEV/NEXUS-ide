import { fileSystemService } from '../../core/filesystem/FileSystemService';

export interface DiagnosticItem {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
}

export class LanguageServerService {
  private diagnosticsCache: Map<string, DiagnosticItem[]> = new Map();

  public analyzeCode(content: string, language: string): DiagnosticItem[] {
    const diagnostics: DiagnosticItem[] = [];
    const lines = content.split('\n');

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;

      // 1. JavaScript / TypeScript Checks
      if (language === 'typescript' || language === 'javascript') {
        if (lineText.includes('console.log(') && !lineText.trim().startsWith('//')) {
          diagnostics.push({
            line: lineNum,
            column: lineText.indexOf('console.log') + 1,
            message: 'Використання console.log(). Рекомендовано видаляти перед релізом.',
            severity: 'info',
            code: 'no-console'
          });
        }
        if (/\bvar\b/.test(lineText) && !lineText.trim().startsWith('//')) {
          diagnostics.push({
            line: lineNum,
            column: lineText.indexOf('var') + 1,
            message: 'Використання застарілого ключового слова "var". Використовуйте "let" або "const".',
            severity: 'warning',
            code: 'no-var'
          });
        }
        if (/\bany\b/.test(lineText) && language === 'typescript') {
          diagnostics.push({
            line: lineNum,
            column: lineText.indexOf('any') + 1,
            message: 'Явне використання типу "any" знижує строгість типів TypeScript.',
            severity: 'warning',
            code: 'no-explicit-any'
          });
        }
        // Basic syntax matching check
        if ((lineText.match(/\{/g) || []).length !== (lineText.match(/\}/g) || []).length) {
          if (!lineText.includes('//')) {
            // Note: simple check
          }
        }
      }

      // 2. Python Checks
      if (language === 'python') {
        if (lineText.includes('print(') && !lineText.trim().startsWith('#')) {
          diagnostics.push({
            line: lineNum,
            column: lineText.indexOf('print') + 1,
            message: 'Використання оператора print().',
            severity: 'info',
            code: 'python-print'
          });
        }
        if (lineText.trim().startsWith('def ') && !lineText.includes(':')) {
          diagnostics.push({
            line: lineNum,
            column: lineText.length,
            message: 'Відсутній символ двоеточіє ":" в оголошенні функції python.',
            severity: 'error',
            code: 'py-syntax-colon'
          });
        }
      }

      // 3. HTML / CSS Checks
      if (language === 'html') {
        if (lineText.includes('<img') && !lineText.includes('alt=')) {
          diagnostics.push({
            line: lineNum,
            column: lineText.indexOf('<img') + 1,
            message: 'Тег <img> повинен мати атрибут alt для покращення доступності (a11y).',
            severity: 'warning',
            code: 'html-a11y-img-alt'
          });
        }
      }
    });

    return diagnostics;
  }

  public registerMonacoProviders(monaco: any) {
    if (!monaco) return;

    const languages = ['typescript', 'javascript', 'python', 'html', 'css', 'json'];

    languages.forEach((lang) => {
      // Autocomplete Provider
      monaco.languages.registerCompletionItemProvider(lang, {
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          };

          const suggestions: any[] = [];

          if (lang === 'typescript' || lang === 'javascript') {
            suggestions.push(
              {
                label: 'clg',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'console.log($1);',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'NEXUS Snippet: Console Log',
                range
              },
              {
                label: 'afn',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'const ${1:name} = (${2:params}) => {\n\t$0\n};',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'NEXUS Snippet: Arrow Function',
                range
              },
              {
                label: 'asyncFn',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'async function ${1:name}(${2:params}): Promise<${3:void}> {\n\ttry {\n\t\t$0\n\t} catch (error) {\n\t\tconsole.error(error);\n\t}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'NEXUS Snippet: Async Function with Try/Catch',
                range
              }
            );
          } else if (lang === 'python') {
            suggestions.push(
              {
                label: 'defmain',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'def main():\n    $0\n\nif __name__ == "__main__":\n    main()',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'NEXUS Python Main Guard',
                range
              }
            );
          }

          return { suggestions };
        }
      });

      // Hover Provider
      monaco.languages.registerHoverProvider(lang, {
        provideHover: (model: any, position: any) => {
          const word = model.getWordAtPosition(position);
          if (!word) return null;

          if (word.word === 'initializeKernel') {
            return {
              range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
              contents: [
                { value: '**NEXUS Kernel Initializer**' },
                { value: '```typescript\nfunction initializeKernel(config: KernelConfig): void\n```' },
                { value: 'Запускає всі внутрішні підсистеми IDE, включаючи LSP, File System, та Extension Engine.' }
              ]
            };
          }

          return {
            range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
            contents: [
              { value: `**Symbol:** \`${word.word}\` (${lang})` },
              { value: '⚡ *NEXUS Language Server Intellisense Enabled*' }
            ]
          };
        }
      });

      // Definition Provider
      monaco.languages.registerDefinitionProvider(lang, {
        provideDefinition: (model: any, position: any) => {
          const word = model.getWordAtPosition(position);
          if (!word) return null;

          // Search across all workspace files for symbol definition
          const allFiles = fileSystemService.getAllFiles();
          for (const file of allFiles) {
            if (file.content?.includes(`function ${word.word}`) || file.content?.includes(`const ${word.word}`)) {
              const lines = file.content.split('\n');
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(word.word)) {
                  return {
                    uri: monaco.Uri.parse(`file://${file.path}`),
                    range: new monaco.Range(i + 1, 1, i + 1, lines[i].length)
                  };
                }
              }
            }
          }
          return null;
        }
      });
    });
  }
}

export const languageServerService = new LanguageServerService();
