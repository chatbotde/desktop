import { BlockedAppsList } from './BlockedAppsList';

interface BlockSettingsProps {
  isDarkTheme?: boolean;
}

export function BlockSettings({ isDarkTheme = false }: BlockSettingsProps) {
  return (
    <div className="w-full h-[300px] max-h-[70vh] flex flex-col overflow-hidden">
      <BlockedAppsList isDarkTheme={isDarkTheme} />
    </div>
  );
}














