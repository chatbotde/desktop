import { useState, useEffect } from 'react';
import { ModelSelector } from './ModelSelector';
import { PromptInputWithActions } from './prompt-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  getSelectedModel, 
  getAvailableModels,
  modelConfigManager,
  type AIModel 
} from '@/lib/ai/model-config';
import { handleModelChange } from '@/lib/ai/unified-ai-service';

export function ModelSelectionDemo() {
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    // Initialize models and selected model
    const models = getAvailableModels();
    const currentModel = getSelectedModel();
    
    setAvailableModels(models);
    setSelectedModel(currentModel);
    
    console.log('Available models:', models);
    console.log('Selected model:', currentModel);
  }, []);

  const handleModelSelectionChange = (model: AIModel) => {
    setSelectedModel(model);
    console.log('Demo: Model changed to:', model);
    
    // Trigger the unified AI service model change handler
    handleModelChange();
    
    setTestMessage(`Model changed to: ${model.displayName}`);
    setTimeout(() => setTestMessage(''), 3000);
  };

  const handleTestMessage = () => {
    console.log('Demo: Test message sent with model:', selectedModel?.displayName);
    setTestMessage('Test message sent to AI service!');
    setTimeout(() => setTestMessage(''), 3000);
  };

  const modelStats = {
    total: availableModels.length,
    google: availableModels.filter(m => m.provider === 'google').length,
    openai: availableModels.filter(m => m.provider === 'openai').length,
    anthropic: availableModels.filter(m => m.provider === 'anthropic').length,
    multimodal: availableModels.filter(m => m.category === 'multimodal').length,
    reasoning: availableModels.filter(m => m.category === 'reasoning').length,
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🤖 AI Model Selection Demo
            {selectedModel && (
              <Badge variant="outline" className="ml-2">
                {selectedModel.displayName}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Test the multi-model support functionality with different AI providers and models
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Selection Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Current Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedModel ? (
                  <>
                    <div className="text-lg font-semibold">{selectedModel.displayName}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedModel.description}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary">{selectedModel.provider}</Badge>
                      <Badge variant="outline">{selectedModel.category}</Badge>
                      {selectedModel.supportsImages && <Badge variant="outline">📷 Images</Badge>}
                      {selectedModel.supportsAudio && <Badge variant="outline">🎵 Audio</Badge>}
                      {selectedModel.supportsVideo && <Badge variant="outline">🎬 Video</Badge>}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Context: {selectedModel.contextWindow.toLocaleString()} tokens • 
                      Max Output: {selectedModel.maxTokens.toLocaleString()}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500">No model selected</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Model Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total Models: <span className="font-semibold">{modelStats.total}</span></div>
                  <div>Google: <span className="font-semibold">{modelStats.google}</span></div>
                  <div>OpenAI: <span className="font-semibold">{modelStats.openai}</span></div>
                  <div>Anthropic: <span className="font-semibold">{modelStats.anthropic}</span></div>
                  <div>Multimodal: <span className="font-semibold">{modelStats.multimodal}</span></div>
                  <div>Reasoning: <span className="font-semibold">{modelStats.reasoning}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Model Selection Components */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Model Selector Variants</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Default Variant</CardTitle>
                </CardHeader>
                <CardContent>
                  <ModelSelector 
                    onModelChange={handleModelSelectionChange}
                    showModelInfo={true}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Compact Variant</CardTitle>
                </CardHeader>
                <CardContent>
                  <ModelSelector 
                    variant="compact"
                    onModelChange={handleModelSelectionChange}
                    showModelInfo={false}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Icon Only Variant</CardTitle>
                </CardHeader>
                <CardContent>
                  <ModelSelector 
                    variant="icon-only"
                    onModelChange={handleModelSelectionChange}
                    showModelInfo={true}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Chat Input Demo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Chat Input with Model Selection</h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 relative">
              <PromptInputWithActions 
                onModelChange={handleModelChange}
              />
            </div>
          </div>

          <Separator />

          {/* Test Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Testing & Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleTestMessage}>
                Send Test Message
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  const models = getAvailableModels();
                  const randomModel = models[Math.floor(Math.random() * models.length)];
                  if (randomModel) {
                    modelConfigManager.setSelectedModel(randomModel.id);
                    setSelectedModel(randomModel);
                    handleModelChange();
                    setTestMessage(`Randomly selected: ${randomModel.displayName}`);
                    setTimeout(() => setTestMessage(''), 3000);
                  }
                }}
              >
                Random Model
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  console.log('Current model config:', selectedModel);
                  console.log('Available models:', availableModels);
                  console.log('Model manager state:', modelConfigManager.getSelectedModel());
                }}
              >
                Debug Info
              </Button>
            </div>
            
            {testMessage && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-200 text-sm">
                {testMessage}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
