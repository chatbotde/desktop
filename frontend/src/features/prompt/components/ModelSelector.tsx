import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { 
  Brain, 
  Zap, 
  Image, 
  Video, 
  Mic, 
  Code, 
  Info,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/shared/lib';
import {
  modelConfigManager,
  getSelectedModel,
  setSelectedModel,
  getAvailableModels,
  type AIModel,
} from '@/lib/ai/model-config';
import { getVisibleModels, MODEL_VISIBILITY_CHANGED_EVENT } from '@/lib/settings/model-visibility';

interface ModelSelectorProps {
  className?: string;
  variant?: 'default' | 'compact' | 'icon-only';
  showModelInfo?: boolean;
  onModelChange?: (model: AIModel) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'multimodal':
      return <Sparkles className="h-3 w-3" />;
    case 'reasoning':
      return <Brain className="h-3 w-3" />;
    case 'coding':
      return <Code className="h-3 w-3" />;
    case 'text':
    default:
      return <Zap className="h-3 w-3" />;
  }
};

const getProviderColor = (provider: string) => {
  switch (provider) {
    case 'google':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'openai':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'anthropic':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'openrouter':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatCost = (cost?: number) => {
  if (!cost) return 'Free';
  if (cost < 1) return `$${cost.toFixed(3)}/1K`;
  return `$${cost.toFixed(2)}/1K`;
};

export function ModelSelector({
  className,
  variant = 'default',
  showModelInfo = true,
  onModelChange,
}: ModelSelectorProps) {
  const [selectedModel, setSelectedModelState] = useState<AIModel | null>(null);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Initialize models and selected model
    const allModels = getAvailableModels();
    const visibleModelIds = getVisibleModels();
    const models = visibleModelIds === null ? allModels : allModels.filter((m) => visibleModelIds.includes(m.id));
    const currentModel = getSelectedModel();
    
    setAvailableModels(models);
    setSelectedModelState(currentModel);
  }, []);

  useEffect(() => {
    const handler = () => {
      const allModels = getAvailableModels();
      const visibleModelIds = getVisibleModels();
      const models = visibleModelIds === null ? allModels : allModels.filter((m) => visibleModelIds.includes(m.id));
      setAvailableModels(models);
      setSelectedModelState(getSelectedModel());
    };

    window.addEventListener(MODEL_VISIBILITY_CHANGED_EVENT, handler);
    return () => window.removeEventListener(MODEL_VISIBILITY_CHANGED_EVENT, handler);
  }, []);

  const handleModelChange = (modelId: string) => {
    const success = setSelectedModel(modelId);
    if (success) {
      const newModel = modelConfigManager.getModelById(modelId);
      setSelectedModelState(newModel);
      if (onModelChange && newModel) {
        onModelChange(newModel);
      }
    }
  };

  // Group models by provider for better organization
  const modelsByProvider = availableModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, AIModel[]>);

  if (variant === 'icon-only') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className={cn("h-9 w-9", className)}>
            <Brain className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <ModelSelectorContent
            selectedModel={selectedModel}
            modelsByProvider={modelsByProvider}
            onModelChange={handleModelChange}
            showModelInfo={showModelInfo}
          />
        </PopoverContent>
      </Popover>
    );
  }

  if (variant === 'compact') {
    return (
      <Select
        value={selectedModel?.id || ''}
        onValueChange={handleModelChange}
      >
        <SelectTrigger className={cn("w-[200px] h-9", className)}>
          <SelectValue>
            {selectedModel ? (
              <div className="flex items-center gap-2">
                {getCategoryIcon(selectedModel.category)}
                <span className="truncate">{selectedModel.displayName}</span>
              </div>
            ) : (
              "Select model"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(modelsByProvider).map(([provider, models]) => (
            <div key={provider}>
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase">
                {provider}
              </div>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(model.category)}
                    <span>{model.displayName}</span>
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Default variant
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "h-9 justify-between min-w-[200px] max-w-[280px]",
            className
          )}
        >
          {selectedModel ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getCategoryIcon(selectedModel.category)}
              <span className="truncate">{selectedModel.displayName}</span>
              <Badge variant="secondary" className="text-xs">
                {selectedModel.provider}
              </Badge>
            </div>
          ) : (
            <span>Select AI Model</span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <ModelSelectorContent
          selectedModel={selectedModel}
          modelsByProvider={modelsByProvider}
          onModelChange={handleModelChange}
          showModelInfo={showModelInfo}
        />
      </PopoverContent>
    </Popover>
  );
}

interface ModelSelectorContentProps {
  selectedModel: AIModel | null;
  modelsByProvider: Record<string, AIModel[]>;
  onModelChange: (modelId: string) => void;
  showModelInfo: boolean;
}

function ModelSelectorContent({
  selectedModel,
  modelsByProvider,
  onModelChange,
  showModelInfo,
}: ModelSelectorContentProps) {
  return (
    <div className="max-h-96 overflow-y-auto">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Choose AI Model</h3>
        <p className="text-xs text-gray-500 mt-1">
          Select the AI model for your conversations
        </p>
      </div>
      
      <div className="p-2">
        {Object.entries(modelsByProvider).map(([provider, models]) => (
          <div key={provider} className="mb-4 last:mb-0">
            <div className="px-2 py-2 text-xs font-medium text-gray-500 uppercase border-b">
              {provider} Models
            </div>
            
            {models.map((model) => (
              <button
                key={model.id}
                className={cn(
                  "w-full p-3 text-left hover:bg-gray-50 transition-colors rounded-lg mt-1",
                  selectedModel?.id === model.id && "bg-blue-50 border border-blue-200"
                )}
                onClick={() => onModelChange(model.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getCategoryIcon(model.category)}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">
                        {model.displayName}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {model.description}
                      </div>
                    </div>
                  </div>
                  
                  {selectedModel?.id === model.id && (
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-1 shrink-0" />
                  )}
                </div>

                {showModelInfo && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getProviderColor(model.provider))}
                    >
                      {model.provider}
                    </Badge>
                    
                    <Badge variant="outline" className="text-xs">
                      {model.category}
                    </Badge>
                    
                    {/* Capability indicators */}
                    <div className="flex items-center gap-1">
                      {model.supportsImages && (
                        <Image className="h-3 w-3 text-gray-400" />
                      )}
                      {model.supportsVideo && (
                        <Video className="h-3 w-3 text-gray-400" />
                      )}
                      {model.supportsAudio && (
                        <Mic className="h-3 w-3 text-gray-400" />
                      )}
                    </div>

                    {/* Cost information */}
                    {(model.inputCost || model.outputCost) && (
                      <div className="text-xs text-gray-500">
                        In: {formatCost(model.inputCost)} • Out: {formatCost(model.outputCost)}
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
      
      {showModelInfo && (
        <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
          <div className="flex items-center gap-1 mb-1">
            <Info className="h-3 w-3" />
            <span className="font-medium">Model Capabilities</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Image className="h-3 w-3" />
              <span>Images</span>
            </div>
            <div className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              <span>Video</span>
            </div>
            <div className="flex items-center gap-1">
              <Mic className="h-3 w-3" />
              <span>Audio</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
