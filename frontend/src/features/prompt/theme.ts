import { GLOBAL_THEME } from '@/global/theme'

export interface ThemeClasses {
  containerBg: string
  containerBorder: string
  buttonBg: string
  buttonHover: string
  buttonBorder: string
  input: string
  textarea: string
  icon: string
  fileItem: string
  fileText: string
}

export function getThemeClasses(isDarkTheme: boolean): ThemeClasses {
  const theme = isDarkTheme ? GLOBAL_THEME.colors.dark : GLOBAL_THEME.colors.light;

  return {
    containerBg: theme.background,
    containerBorder: `border-${isDarkTheme ? 'zinc-800' : 'zinc-200'}`,
    buttonBg: theme.background,
    buttonHover: isDarkTheme ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100',
    buttonBorder: `border-${isDarkTheme ? 'zinc-800' : 'zinc-200'}`,
    input: `${theme.text === '#fafafa' ? 'text-zinc-200' : 'text-zinc-900'} placeholder:text-zinc-500`,
    textarea: `${theme.text === '#fafafa' ? 'text-zinc-200' : 'text-zinc-900'} placeholder:text-zinc-500`,
    icon: isDarkTheme ? 'text-zinc-300' : 'text-zinc-600',
    fileItem: isDarkTheme ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200',
    fileText: isDarkTheme ? 'text-zinc-200' : 'text-zinc-900',
  };
}

export function getHoverClass(isDarkTheme: boolean): string {
  return isDarkTheme ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
}

// Legacy alias for backward compatibility
export const promptInputTheme = {
  getThemeClasses,
  getHoverClass
}
