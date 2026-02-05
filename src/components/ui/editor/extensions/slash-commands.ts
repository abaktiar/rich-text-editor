import { Extension } from '@tiptap/core'
import { Suggestion } from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import type { SlashCommand } from '../types'
import type { Editor, Range } from '@tiptap/core'

const slashCommandsPluginKey = new PluginKey('slashCommands')

export interface SlashCommandsOptions {
  suggestion: {
    char?: string
    startOfLine?: boolean
    items: (props: { query: string; editor: Editor }) => SlashCommand[]
    command: (props: { editor: Editor; range: Range; props: SlashCommand }) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: () => any
  }
}

export const SlashCommands = Extension.create<SlashCommandsOptions>({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: true,
        items: () => [],
        command: ({ editor, range, props }) => {
          // Delete the slash and query text
          editor.chain().focus().deleteRange(range).run()
          // Execute the command action
          props.action(editor)
        },
        render: () => ({
          onStart: () => {},
          onUpdate: () => {},
          onKeyDown: () => false,
          onExit: () => {},
        }),
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Suggestion({
        editor: this.editor,
        pluginKey: slashCommandsPluginKey,
        ...this.options.suggestion,
      } as any),
    ]
  },
})
