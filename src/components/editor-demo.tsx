import { useState, useRef, useMemo, useEffect } from 'react'
import {
  RichTextEditor,
  RichTextViewer,
  type RichTextEditorRef,
  type EditorContent,
  createFileUploadPlugin,
  createMentionPlugin,
} from '@/components/ui/editor'
import { Button } from '@/components/ui/button'
import {
  Moon,
  Sun,
  Type,
  Code,
  Eye,
  Pencil,
  Terminal,
  Zap,
  Paperclip,
  AtSign,
  ArrowRight,
  Github,
  Copy,
  Check,
  Sparkles,
  Layers,
  MousePointer2,
  FileText,
} from 'lucide-react'

// Sample users for mention demo
const sampleUsers = [
  { id: '1', label: 'John Doe', avatar: 'https://i.pravatar.cc/150?u=john' },
  { id: '2', label: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?u=jane' },
  { id: '3', label: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=alex' },
  { id: '4', label: 'Sarah Wilson', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { id: '5', label: 'Mike Brown', avatar: 'https://i.pravatar.cc/150?u=mike' },
  { id: '6', label: 'Emily Davis', avatar: 'https://i.pravatar.cc/150?u=emily' },
  { id: '7', label: 'Chris Taylor' },
  { id: '8', label: 'Amanda Lee', avatar: 'https://i.pravatar.cc/150?u=amanda' },
]

// Demo content showcasing all editor features
const demoContent = `
<h1>Rich Text Editor Demo</h1>
<p>This editor supports <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strikethrough</s>, and <code>inline code</code>. You can also add <a href="https://github.com">links</a> and <mark>highlighted text</mark>.</p>

<h2>Text Formatting</h2>
<p>Select any text to see the bubble menu with formatting options. Use keyboard shortcuts like <code>Cmd+B</code> for bold, <code>Cmd+I</code> for italic, or <code>Cmd+K</code> to add links.</p>

<h3>Lists</h3>
<p>Bullet lists for unordered items:</p>
<ul>
  <li>First item with some content</li>
  <li>Second item with <strong>bold text</strong></li>
  <li>Third item with a <a href="#">link</a></li>
</ul>

<p>Numbered lists for sequential steps:</p>
<ol>
  <li>Install the editor component</li>
  <li>Import it into your React app</li>
  <li>Customize to your needs</li>
</ol>

<h3>Task Lists</h3>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true">Design the interface</li>
  <li data-type="taskItem" data-checked="true">Implement core features</li>
  <li data-type="taskItem" data-checked="false">Write documentation</li>
  <li data-type="taskItem" data-checked="false">Ship to production</li>
</ul>

<h2>Blockquote</h2>
<blockquote>
  <p>"The details are not the details. They make the design." — Charles Eames</p>
</blockquote>

<h2>Code Block</h2>
<p>Syntax highlighted code with language selection:</p>
<pre><code class="language-typescript">import { RichTextEditor } from '@/components/ui/editor'

interface Props {
  initialContent?: string
  onSave: (content: string) => void
}

export function MyEditor({ initialContent, onSave }: Props) {
  const [content, setContent] = useState(initialContent ?? '')

  return (
    <RichTextEditor
      content={content}
      onChange={(c) => setContent(c.html ?? '')}
      placeholder="Start writing..."
    />
  )
}</code></pre>

<h2>Table</h2>
<p>Tables with resizable columns and row/column controls:</p>
<table>
  <tbody>
    <tr>
      <th>Feature</th>
      <th>Status</th>
      <th>Notes</th>
    </tr>
    <tr>
      <td>Rich Text</td>
      <td>✅ Complete</td>
      <td>Bold, italic, underline, etc.</td>
    </tr>
    <tr>
      <td>Slash Commands</td>
      <td>✅ Complete</td>
      <td>Type / to open menu</td>
    </tr>
    <tr>
      <td>@Mentions</td>
      <td>✅ Complete</td>
      <td>Type @ to mention users</td>
    </tr>
    <tr>
      <td>File Attachments</td>
      <td>✅ Complete</td>
      <td>Drag & drop support</td>
    </tr>
  </tbody>
</table>

<h2>Callouts</h2>
<p>Highlight important information with callouts:</p>
<div data-type="callout" data-callout-type="info">
  <p><strong>Info:</strong> Use callouts to draw attention to important information. Type <code>/callout</code> to insert one.</p>
</div>

<div data-type="callout" data-callout-type="warning">
  <p><strong>Warning:</strong> Be careful with this action. It cannot be undone!</p>
</div>

<div data-type="callout" data-callout-type="success">
  <p><strong>Success:</strong> Your changes have been saved successfully.</p>
</div>

<h2>Toggle / Collapsible</h2>
<details data-type="toggle">
  <summary>Click to expand this section</summary>
  <p>This content is hidden by default and revealed when you click the toggle. Great for FAQs, additional details, or keeping your document organized.</p>
  <ul>
    <li>Nested content works too</li>
    <li>Including lists and other elements</li>
  </ul>
</details>

<hr>

<h2>Try It Yourself!</h2>
<p>This editor is fully interactive. Try these actions:</p>
<ul>
  <li>Type <code>/</code> at the start of a line for slash commands</li>
  <li>Type <code>@</code> to mention someone</li>
  <li>Select text to see the formatting toolbar</li>
  <li>Drag and drop files to attach them</li>
  <li>Click on a table to see row/column controls</li>
</ul>
`

const installCommand = 'npx shadcn@latest add https://abaktiar.github.io/rich-text-editor/r/rich-text-editor.json'

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className={`p-2 rounded-md bg-foreground/5 hover:bg-foreground/10 transition-colors ${className ?? ''}`}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: typeof Type
  title: string
  description: string
  delay: number
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-border transition-all duration-500 hover:shadow-lg hover:shadow-foreground/5 ${
        isVisible ? 'animate-fade-in-up' : 'opacity-0'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-demo-warm/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-demo-warm/20 to-demo-warm/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-5 h-5 text-demo-warm" />
        </div>
        <h3 className="font-semibold text-lg mb-2 font-[family-name:var(--font-display)]">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export function EditorDemo() {
  const [isDark, setIsDark] = useState(true)
  const [mode, setMode] = useState<'edit' | 'view'>('edit')
  const [content, setContent] = useState<EditorContent>({ html: demoContent })
  const editorRef = useRef<RichTextEditorRef>(null)

  // Set dark mode on mount
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  // Create file upload plugin
  const fileUploadPlugin = useMemo(
    () =>
      createFileUploadPlugin({
        onUpload: async (file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsDataURL(file)
          })
        },
        accept: ['image/*', 'application/pdf', '.doc', '.docx', '.txt', '.md', '.csv', '.json'],
        maxSize: 10 * 1024 * 1024,
        displayModeByType: {
          'image/*': 'block',
          'application/pdf': 'block',
        },
        previewOptions: {
          csv: { showRowNumbers: true, alternateRowColors: true, maxRows: 500, delimiter: 'auto' },
          text: { showLineNumbers: true, fontSize: 13 },
          image: { allowZoom: true, showMetadata: true, transparentBackground: 'checkerboard' },
        },
      }),
    []
  )

  // Mention click handler
  const handleMentionClick = (item: { id: string; label: string }) => {
    alert(`Clicked on @${item.label}`)
  }

  // Create mention plugin
  const mentionPlugin = useMemo(
    () =>
      createMentionPlugin({
        onSearch: async (query) => {
          await new Promise((r) => setTimeout(r, 100))
          return sampleUsers.filter((u) =>
            u.label.toLowerCase().includes(query.toLowerCase())
          )
        },
        onMentionSelect: (item) => console.log('Mentioned:', item.label),
        onMentionClick: handleMentionClick,
      }),
    []
  )

  const toggleTheme = () => {
    setIsDark((prev) => !prev)
    document.documentElement.classList.toggle('dark')
  }

  const features = [
    {
      icon: Type,
      title: 'Rich Formatting',
      description: 'Bold, italic, underline, strikethrough, code, and more. Everything you need for expressive writing.',
    },
    {
      icon: Terminal,
      title: 'Slash Commands',
      description: 'Type "/" anywhere to access all block types. Fast, intuitive, keyboard-first.',
    },
    {
      icon: Layers,
      title: 'Block Types',
      description: 'Headings, lists, quotes, code blocks, images, tables, callouts, and toggles.',
    },
    {
      icon: Zap,
      title: 'Keyboard Shortcuts',
      description: 'Muscle memory friendly. Cmd+B, Cmd+I, Cmd+K, and many more standard shortcuts.',
    },
    {
      icon: Paperclip,
      title: 'File Attachments',
      description: 'Drag and drop files. Preview CSVs, images, PDFs, and more directly in the editor.',
    },
    {
      icon: AtSign,
      title: '@Mentions',
      description: 'Type "@" to mention users. Async search support with customizable suggestion list.',
    },
    {
      icon: MousePointer2,
      title: 'Bubble Menu',
      description: 'Select text to reveal formatting options. Context-aware and unobtrusive.',
    },
    {
      icon: Sparkles,
      title: 'Plugin System',
      description: 'Extend with custom blocks, commands, and toolbar actions. Fully typed API.',
    },
    {
      icon: Code,
      title: 'Developer Friendly',
      description: 'TypeScript first. Full API access. Controlled and uncontrolled modes.',
    },
  ]

  return (
    <div className='min-h-screen bg-background text-foreground overflow-x-hidden'>
      {/* Grain overlay */}
      <div className='grain-overlay' />

      {/* Header */}
      <header className='fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50'>
        <div className='max-w-6xl mx-auto px-6 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 rounded-lg bg-foreground flex items-center justify-center'>
              <FileText className='w-4 h-4 text-background' />
            </div>
            <span className='font-semibold tracking-tight font-[family-name:var(--font-display)]'>
              Rich Text Editor
            </span>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              className='inline-flex items-center gap-2 text-muted-foreground hover:text-foreground'
              asChild>
              <a
                href='https://github.com/abaktiar/rich-text-editor'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-2'>
                <Github className='w-4 h-4' />
                <span className='hidden sm:inline'>GitHub</span>
              </a>
            </Button>
            <Button
              variant='ghost'
              size='icon'
              onClick={toggleTheme}
              className='text-muted-foreground hover:text-foreground'>
              {isDark ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className='pt-32 pb-20 px-6'>
        <div className='max-w-4xl mx-auto text-center'>
          <div className='animate-fade-in-up'>
            <p className='text-demo-warm font-medium tracking-wide uppercase text-sm mb-6'>
              Open Source · React · Tiptap
            </p>
          </div>

          <h1 className='animate-fade-in-up delay-100 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 font-[family-name:var(--font-display)] leading-[1.1]'>
            A beautiful editor
            <br />
            <span className='text-muted-foreground'>for beautiful words</span>
          </h1>

          <p className='animate-fade-in-up delay-200 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed'>
            A modern, extensible rich text editor component. Built with Tiptap, styled with shadcn/ui, and designed for
            developers who care about the details.
          </p>

          <div className='animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-4 justify-center items-center mb-12'>
            <Button size='lg' className='inline-flex items-center gap-2 px-6 h-12 text-base' asChild>
              <a href='#demo' className='inline-flex items-center gap-2'>
                Try the Demo
                <ArrowRight className='w-4 h-4' />
              </a>
            </Button>
            <Button variant='outline' size='lg' className='inline-flex items-center gap-2 px-6 h-12 text-base' asChild>
              <a
                href='https://github.com/abaktiar/rich-text-editor'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-2'>
                <Github className='w-4 h-4' />
                View on GitHub
              </a>
            </Button>
          </div>

          {/* Install command */}
          <div className='animate-fade-in-up delay-400 max-w-4xl mx-auto'>
            <div className='relative group'>
              <div className='absolute -inset-1 bg-gradient-to-r from-demo-warm/20 via-demo-warm/10 to-demo-warm/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
              <div className='relative bg-card border border-border rounded-xl flex items-center'>
                <div className='flex-1 p-4 overflow-x-auto font-mono text-sm'>
                  <code className='text-muted-foreground whitespace-nowrap'>{installCommand}</code>
                </div>
                <div className='flex-shrink-0 p-2 bg-card'>
                  <CopyButton text={installCommand} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className='py-20 px-6 bg-muted/30'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl sm:text-4xl font-bold mb-4 font-[family-name:var(--font-display)]'>
              Everything you need
            </h2>
            <p className='text-muted-foreground text-lg max-w-xl mx-auto'>
              A complete editing experience, thoughtfully designed and meticulously built.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} delay={i * 75} />
            ))}
          </div>
        </div>
      </section>

      {/* Editor Demo */}
      <section id='demo' className='py-20 px-6 scroll-mt-20'>
        <div className='max-w-5xl mx-auto'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl sm:text-4xl font-bold mb-4 font-[family-name:var(--font-display)]'>
              Try it yourself
            </h2>
            <p className='text-muted-foreground text-lg'>
              Type <code className='px-1.5 py-0.5 rounded bg-muted text-sm'>/</code> to open commands, or{' '}
              <code className='px-1.5 py-0.5 rounded bg-muted text-sm'>@</code> to mention someone.
            </p>
          </div>

          {/* Mode toggle */}
          <div className='flex justify-center mb-6'>
            <div className='inline-flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border/50'>
              <button
                onClick={() => setMode('edit')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'edit'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}>
                <Pencil className='w-4 h-4' />
                Edit
              </button>
              <button
                onClick={() => setMode('view')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'view'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}>
                <Eye className='w-4 h-4' />
                Preview
              </button>
            </div>
          </div>

          {/* Editor container */}
          <div className='relative group'>
            <div className='absolute -inset-3 bg-gradient-to-r from-demo-warm/10 via-transparent to-demo-warm/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700' />
            <div className='relative bg-card border border-border rounded-2xl shadow-xl shadow-foreground/5 overflow-hidden'>
              {mode === 'edit' ? (
                <RichTextEditor
                  ref={editorRef}
                  content={content.html}
                  onChange={setContent}
                  placeholder="Type '/' for commands..."
                  minHeight='600px'
                  codeBlockMaxHeight={400}
                  className='border-0'
                  plugins={[fileUploadPlugin, mentionPlugin]}
                />
              ) : (
                <RichTextViewer
                  content={content.html ?? ''}
                  className='border-0 min-h-[600px]'
                  codeBlockMaxHeight={400}
                  onMentionClick={handleMentionClick}
                />
              )}
            </div>
          </div>

          <p className='text-center text-sm text-muted-foreground mt-6'>
            Tip: Try <code className='px-1.5 py-0.5 rounded bg-muted text-xs'>/code</code> for syntax highlighted code
            blocks, <code className='px-1.5 py-0.5 rounded bg-muted text-xs'>/table</code> for tables, or{' '}
            <code className='px-1.5 py-0.5 rounded bg-muted text-xs'>/callout</code> for callouts.
          </p>
        </div>
      </section>

      {/* Code Example */}
      <section className='py-20 px-6 bg-muted/30'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl sm:text-4xl font-bold mb-4 font-[family-name:var(--font-display)]'>
              Simple to integrate
            </h2>
            <p className='text-muted-foreground text-lg'>
              Drop it into your React project. Customize to your heart's content.
            </p>
          </div>

          <div className='relative'>
            <div className='absolute -inset-4 bg-gradient-to-b from-demo-warm/10 to-transparent rounded-3xl blur-2xl opacity-50' />
            <div className='relative bg-[#1a1815] dark:bg-[#0d0c0a] rounded-2xl p-6 overflow-x-auto border border-white/5'>
              <pre className='text-sm leading-relaxed'>
                <code className='text-[#f5f2ed]'>
                  <span className='text-[#7aa2f7]'>import</span>
                  <span className='text-[#f5f2ed]'>{' { '}</span>
                  <span className='text-[#c4a07a]'>RichTextEditor</span>
                  <span className='text-[#f5f2ed]'>{' } '}</span>
                  <span className='text-[#7aa2f7]'>from</span>
                  <span className='text-[#9ece6a]'> '@/components/ui/editor'</span>
                  {'\n\n'}
                  <span className='text-[#7aa2f7]'>export function</span>
                  <span className='text-[#bb9af7]'> MyEditor</span>
                  <span className='text-[#f5f2ed]'>() {'{'}</span>
                  {'\n'}
                  <span className='text-[#f5f2ed]'>{'  '}</span>
                  <span className='text-[#7aa2f7]'>const</span>
                  <span className='text-[#f5f2ed]'> [</span>
                  <span className='text-[#c4a07a]'>content</span>
                  <span className='text-[#f5f2ed]'>, </span>
                  <span className='text-[#c4a07a]'>setContent</span>
                  <span className='text-[#f5f2ed]'>] = </span>
                  <span className='text-[#bb9af7]'>useState</span>
                  <span className='text-[#f5f2ed]'>(</span>
                  <span className='text-[#9ece6a]'>''</span>
                  <span className='text-[#f5f2ed]'>)</span>
                  {'\n\n'}
                  <span className='text-[#f5f2ed]'>{'  '}</span>
                  <span className='text-[#7aa2f7]'>return</span>
                  <span className='text-[#f5f2ed]'> (</span>
                  {'\n'}
                  <span className='text-[#f5f2ed]'>{'    '}&lt;</span>
                  <span className='text-[#bb9af7]'>RichTextEditor</span>
                  {'\n'}
                  <span className='text-[#f5f2ed]'>{'      '}</span>
                  <span className='text-[#c4a07a]'>content</span>
                  <span className='text-[#f5f2ed]'>={'{'}</span>
                  <span className='text-[#c4a07a]'>content</span>
                  <span className='text-[#f5f2ed]'>{'}'}</span>
                  {'\n'}
                  <span className='text-[#f5f2ed]'>{'      '}</span>
                  <span className='text-[#c4a07a]'>onChange</span>
                  <span className='text-[#f5f2ed]'>={'{'}</span>
                  <span className='text-[#f5f2ed]'>(</span>
                  <span className='text-[#c4a07a]'>c</span>
                  <span className='text-[#f5f2ed]'>) </span>
                  <span className='text-[#7aa2f7]'>=&gt;</span>
                  <span className='text-[#f5f2ed]'> </span>
                  <span className='text-[#bb9af7]'>setContent</span>
                  <span className='text-[#f5f2ed]'>(</span>
                  <span className='text-[#c4a07a]'>c</span>
                  <span className='text-[#f5f2ed]'>.</span>
                  <span className='text-[#c4a07a]'>html</span>
                  <span className='text-[#f5f2ed]'>){'}'}</span>
                  {'\n'}
                  <span className='text-[#f5f2ed]'>{'      '}</span>
                  <span className='text-[#c4a07a]'>placeholder</span>
                  <span className='text-[#f5f2ed]'>=</span>
                  <span className='text-[#9ece6a]'>"Start writing..."</span>
                  {'\n'}
                  <span className='text-[#f5f2ed]'>{'    '}/&gt;</span>
                  {'\n'}
                  <span className='text-[#f5f2ed]'>{'  '})</span>
                  {'\n'}
                  <span className='text-[#f5f2ed]'>{'}'}</span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-24 px-6'>
        <div className='max-w-3xl mx-auto text-center'>
          <h2 className='text-3xl sm:text-4xl font-bold mb-6 font-[family-name:var(--font-display)]'>
            Ready to get started?
          </h2>
          <p className='text-muted-foreground text-lg mb-10 max-w-xl mx-auto'>
            Install the editor with a single command. Full documentation and examples available on GitHub.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' className='inline-flex items-center gap-2 px-8 h-12 text-base' asChild>
              <a
                href='https://github.com/abaktiar/rich-text-editor'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-2'>
                <Github className='w-4 h-4' />
                Get Started
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='py-8 px-6 border-t border-border/50'>
        <div className='max-w-6xl mx-auto flex flex-col items-center gap-4'>
          <p className='text-sm text-muted-foreground'>
            Built with{' '}
            <a
              href='https://tiptap.dev'
              className='underline underline-offset-4 hover:text-foreground transition-colors'
              target='_blank'
              rel='noopener noreferrer'>
              Tiptap
            </a>
            {' + '}
            <a
              href='https://ui.shadcn.com'
              className='underline underline-offset-4 hover:text-foreground transition-colors'
              target='_blank'
              rel='noopener noreferrer'>
              shadcn/ui
            </a>
            {' · '}
            Open source under MIT License
          </p>
          <p className='text-sm text-muted-foreground'>
            Developed with <span className='text-demo-warm'>♥</span> by{' '}
            <a
              href='https://github.com/abaktiar'
              className='underline underline-offset-4 hover:text-foreground transition-colors'
              target='_blank'
              rel='noopener noreferrer'>
              A. Baktiar
            </a>
            {' & '}
            <a
              href='https://claude.ai/code'
              className='underline underline-offset-4 hover:text-foreground transition-colors'
              target='_blank'
              rel='noopener noreferrer'>
              Claude Code
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
