export interface ThemeClasses {
  card: string
  cardBg: string
  dragButton: string
  iconButton: string
  content: string
  contentBg: string
  emptyText: string
  resizeIcon: string
}

export function getThemeClasses(isDarkTheme: boolean): ThemeClasses {
  return isDarkTheme 
    ? {
        card: 'fixed border border-zinc-700 shadow-lg',
        cardBg: 'oklch(0.14 0.00 0)',
        dragButton: 'p-1.5 rounded hover:bg-zinc-800 transition-colors cursor-grab active:cursor-grabbing text-zinc-300',
        iconButton: 'p-1 rounded-full hover:bg-zinc-800 transition-colors text-zinc-300',
        content: 'p-4 overflow-y-auto',
        contentBg: 'oklch(0.14 0.00 0)',
        emptyText: 'text-zinc-400 text-sm text-center',
        resizeIcon: 'text-zinc-500'
      }
    : {
        card: 'fixed border border-zinc-200 bg-white shadow-lg',
        cardBg: '#ffffff',
        dragButton: 'p-1.5 rounded hover:bg-zinc-100 transition-colors cursor-grab active:cursor-grabbing text-zinc-700',
        iconButton: 'p-1 rounded-full hover:bg-zinc-100 transition-colors text-zinc-700',
        content: 'p-4 overflow-y-auto bg-white',
        contentBg: '#ffffff',
        emptyText: 'text-zinc-600 text-sm text-center',
        resizeIcon: 'text-zinc-600'
      }
}
