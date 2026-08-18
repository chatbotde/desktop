import { APP_SURFACES } from '@/lib/appearance/surfaces'

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

export function getThemeClasses(_isDarkTheme?: boolean): ThemeClasses {
  const surfaceBg = 'hsl(var(--card) / var(--appearance-surface-opacity, 1))'

  return {
    card: `fixed shadow-lg ${APP_SURFACES.base} ${APP_SURFACES.border}`,
    cardBg: surfaceBg,
    dragButton: `${APP_SURFACES.hover} p-1.5 cursor-grab active:cursor-grabbing ${APP_SURFACES.icon}`,
    iconButton: `${APP_SURFACES.hover} p-1 rounded-full ${APP_SURFACES.icon}`,
    content: 'p-4 overflow-y-auto',
    contentBg: surfaceBg,
    emptyText: `${APP_SURFACES.textMuted} text-sm text-center`,
    resizeIcon: APP_SURFACES.icon,
  }
}
