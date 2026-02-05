import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import { useState, useCallback } from 'react'
import { Check, Copy, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Common programming languages for the selector
const LANGUAGES = [
  { value: '', label: 'Plain text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'shell', label: 'Shell' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'xml', label: 'XML' },
  { value: 'dockerfile', label: 'Dockerfile' },
]

export function CodeBlockComponent({ node, updateAttributes, editor }: NodeViewProps) {
  const [copied, setCopied] = useState(false)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)

  const language = node.attrs.language || ''
  const currentLanguage = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0]
  const isEditable = editor.isEditable

  const copyCode = useCallback(() => {
    const code = node.textContent
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [node.textContent])

  const setLanguage = useCallback(
    (lang: string) => {
      updateAttributes({ language: lang })
      setShowLanguageDropdown(false)
    },
    [updateAttributes],
  )

  // In view mode, render a simpler code block without edit controls
  if (!isEditable) {
    return (
      <NodeViewWrapper className="code-block-wrapper code-block-view-mode">
        <div className="code-block-header">
          {/* Show language label (read-only) */}
          <div className="code-block-language-label">{currentLanguage.label}</div>

          {/* Copy Button - available in view mode too */}
          <button className="code-block-copy-button" onClick={copyCode} contentEditable={false} title="Copy code">
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <pre>
          <code>
            <NodeViewContent />
          </code>
        </pre>
      </NodeViewWrapper>
    )
  }

  // Edit mode - full controls
  return (
    <NodeViewWrapper className="code-block-wrapper">
      <div className="code-block-header">
        {/* Language Selector */}
        <div className="code-block-language-container">
          <button
            className="code-block-language-button"
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            contentEditable={false}
          >
            <span>{currentLanguage.label}</span>
            <ChevronDown size={14} />
          </button>

          {showLanguageDropdown && (
            <div className="code-block-language-dropdown" contentEditable={false}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  className={cn(
                    'code-block-language-option',
                    lang.value === language && 'code-block-language-option-active',
                  )}
                  onClick={() => setLanguage(lang.value)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Copy Button */}
        <button className="code-block-copy-button" onClick={copyCode} contentEditable={false} title="Copy code">
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <pre>
        <code>
          <NodeViewContent />
        </code>
      </pre>
    </NodeViewWrapper>
  )
}
