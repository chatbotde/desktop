import { BlockedAppsList } from './BlockedAppsList';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BlockSettingsProps {
  isDarkTheme?: boolean;
}

export function BlockSettings({ isDarkTheme = false }: BlockSettingsProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Card 
        className={cn(
          'w-full min-w-[400px] h-[300px] flex flex-col overflow-hidden',
          isDarkTheme ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        )}
      >
        <BlockedAppsList isDarkTheme={isDarkTheme} />
      </Card>
    </div>
  );
}


