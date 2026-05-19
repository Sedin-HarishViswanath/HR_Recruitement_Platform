import Editor from '@monaco-editor/react';
import type { OnChange } from '@monaco-editor/react';

interface CodeEditorProps {
  language: string;
  value: string;
  onChange?: OnChange;
  theme?: 'vs-dark' | 'light';
  readOnly?: boolean;
}

export function CodeEditor({ 
  language, 
  value, 
  onChange, 
  theme = 'vs-dark', 
  readOnly = false 
}: CodeEditorProps) {
  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      theme={theme}
      onChange={onChange}
      options={{
        readOnly,
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  );
}
