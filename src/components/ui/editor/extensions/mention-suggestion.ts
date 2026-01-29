import { Extension } from '@tiptap/core'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import type { MentionItem } from '../types'

const mentionSuggestionPluginKey = new PluginKey('mentionSuggestion')

export interface MentionSuggestionOptions {
  trigger: string
  onSearch: (query: string) => Promise<MentionItem[]> | MentionItem[]
  allowSpaces: boolean
  minQueryLength: number
  maxSuggestions: number
  debounceMs: number
  renderItem?: (item: MentionItem, isSelected: boolean) => React.ReactNode
  noResultsText: string
  loadingText: string
  onMentionSelect?: (item: MentionItem) => void
  suggestion?: Omit<SuggestionOptions<MentionItem>, 'editor'>
}

export const MentionSuggestion = Extension.create<MentionSuggestionOptions>({
  name: 'mentionSuggestion',

  addOptions() {
    return {
      trigger: '@',
      onSearch: () => [],
      allowSpaces: false,
      minQueryLength: 0,
      maxSuggestions: 10,
      debounceMs: 150,
      renderItem: undefined,
      noResultsText: 'No results found',
      loadingText: 'Searching...',
      onMentionSelect: undefined,
      suggestion: undefined,
    }
  },

  addStorage() {
    return {
      renderItem: this.options.renderItem,
      noResultsText: this.options.noResultsText,
      loadingText: this.options.loadingText,
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        pluginKey: mentionSuggestionPluginKey,
        char: this.options.trigger,
        allowSpaces: this.options.allowSpaces,
        startOfLine: false, // Allow @ anywhere

        items: async ({ query }) => {
          if (query.length < this.options.minQueryLength) return []
          const results = await this.options.onSearch(query)
          return results.slice(0, this.options.maxSuggestions)
        },

        command: ({ editor, range, props }) => {
          // Insert a space after the mention if we're not at the end or if there's no space
          const nodeAfter = editor.view.state.selection.$to.nodeAfter
          const addSpace = !nodeAfter?.text?.startsWith(' ')

          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setMention({
              id: props.id,
              label: props.label,
              avatar: props.avatar,
              metadata: props.metadata,
            })
            .command(({ tr }) => {
              if (addSpace) {
                tr.insertText(' ')
              }
              return true
            })
            .run()

          this.options.onMentionSelect?.(props)
        },

        ...this.options.suggestion,
      }),
    ]
  },
})
