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
  return isDarkTheme
    ? {
        containerBg: 'oklch(0.14 0.00 0)',
        containerBorder: 'border-zinc-700',
        buttonBg: 'oklch(0.14 0.00 0)',
        buttonHover: 'hover:bg-zinc-800',
        buttonBorder: 'border-zinc-700',
        input: 'text-zinc-200 placeholder:text-zinc-500',
        textarea: 'text-zinc-200 placeholder:text-zinc-500',
        icon: 'text-zinc-300',
        fileItem: 'bg-zinc-800 border-zinc-700',
        fileText: 'text-zinc-200',
      }
    : {
        containerBg: '#ffffff',
        containerBorder: 'border-zinc-200',
        buttonBg: '#ffffff',
        buttonHover: 'hover:bg-zinc-50',
        buttonBorder: 'border-zinc-200',
        input: 'text-zinc-900 placeholder:text-zinc-400',
        textarea: 'text-zinc-900 placeholder:text-zinc-400',
        icon: 'text-zinc-600',
        fileItem: 'bg-zinc-50 border-zinc-200',
        fileText: 'text-zinc-900',
      }
}

export function getHoverClass(isDarkTheme: boolean): string {
  return isDarkTheme ? 'hover:bg-white/10' : 'hover:bg-zinc-100'
}

// Legacy alias for backward compatibility
export const promptInputTheme = {
  getThemeClasses,
  getHoverClass
}
