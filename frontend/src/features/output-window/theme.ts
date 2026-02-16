import { GLOBAL_THEME } from '@/global/theme'

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
  const theme = isDarkTheme ? GLOBAL_THEME.colors.dark : GLOBAL_THEME.colors.light;

  return {
    card: `fixed border border-${isDarkTheme ? 'zinc-800' : 'zinc-200'} shadow-lg`,
    cardBg: theme.card,
    dragButton: `p-1.5 rounded hover:bg-${isDarkTheme ? 'zinc-800' : 'zinc-100'} transition-colors cursor-grab active:cursor-grabbing text-${isDarkTheme ? 'zinc-300' : 'zinc-700'}`,
    iconButton: `p-1 rounded-full hover:bg-${isDarkTheme ? 'zinc-800' : 'zinc-100'} transition-colors text-${isDarkTheme ? 'zinc-300' : 'zinc-700'}`,
    content: 'p-4 overflow-y-auto',
    contentBg: theme.card,
    emptyText: `text-${isDarkTheme ? 'zinc-400' : 'zinc-600'} text-sm text-center`,
    resizeIcon: `text-${isDarkTheme ? 'zinc-500' : 'zinc-600'}`
  };
}
