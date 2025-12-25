/**
 * System Prompt Selector Component
 * Allows users to switch between different AI assistant modes
 */

import { useState, useEffect } from 'react';
import { unifiedAIService, SYSTEM_PROMPTS, type SystemPrompt } from '@/lib/ai';

export function SystemPromptSelector() {
  const [selectedPrompt, setSelectedPrompt] = useState<SystemPrompt | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Get current system prompt on mount
    const current = unifiedAIService.getCurrentSystemPrompt();
    setSelectedPrompt(current);
  }, []);

  const handlePromptChange = (promptId: string) => {
    unifiedAIService.setSystemPrompt(promptId);
    const newPrompt = unifiedAIService.getCurrentSystemPrompt();
    setSelectedPrompt(newPrompt);
    setIsOpen(false);

    // Save preference to localStorage
    localStorage.setItem('preferredSystemPrompt', promptId);

    // Optionally clear chat history when switching modes
    // unifiedAIService.clearHistory();
  };

  return (
    <div className="system-prompt-selector">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="prompt-selector-button"
        aria-label="Select AI assistant mode"
        title={`Current mode: ${selectedPrompt?.name || 'Learning Assistant'}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m-6-6h6m6 0h6" />
        </svg>
        <span className="prompt-name">
          {selectedPrompt?.name || 'Learning Assistant'}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`chevron ${isOpen ? 'open' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="prompt-selector-backdrop"
            onClick={() => setIsOpen(false)}
          />
          <div className="prompt-selector-dropdown">
            <div className="prompt-dropdown-header">
              <h3>AI Assistant Mode</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="close-button"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="prompt-options">
              {SYSTEM_PROMPTS.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handlePromptChange(prompt.id)}
                  className={`prompt-option ${
                    selectedPrompt?.id === prompt.id ? 'active' : ''
                  }`}
                >
                  <div className="prompt-option-header">
                    <span className="prompt-icon">{getPromptIcon(prompt.id)}</span>
                    <strong>{prompt.name}</strong>
                    {selectedPrompt?.id === prompt.id && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="check-icon"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                  <p className="prompt-description">{prompt.description}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        .system-prompt-selector {
          position: relative;
        }

        .prompt-selector-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: inherit;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .prompt-selector-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .prompt-name {
          font-weight: 500;
        }

        .chevron {
          transition: transform 0.2s ease;
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .prompt-selector-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 49;
        }

        .prompt-selector-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 320px;
          max-height: 480px;
          overflow-y: auto;
          background: rgba(30, 30, 30, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          z-index: 50;
          backdrop-filter: blur(12px);
        }

        .prompt-dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .prompt-dropdown-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .close-button {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }

        .prompt-options {
          padding: 8px;
        }

        .prompt-option {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          padding: 12px;
          margin-bottom: 4px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .prompt-option:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .prompt-option.active {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.4);
        }

        .prompt-option-header {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }

        .prompt-icon {
          font-size: 18px;
          line-height: 1;
        }

        .prompt-option strong {
          flex: 1;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
        }

        .check-icon {
          color: rgb(59, 130, 246);
          flex-shrink: 0;
        }

        .prompt-description {
          margin: 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.4;
          padding-left: 26px;
        }

        /* Scrollbar styling */
        .prompt-selector-dropdown::-webkit-scrollbar {
          width: 6px;
        }

        .prompt-selector-dropdown::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .prompt-selector-dropdown::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .prompt-selector-dropdown::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}

// Helper function to get emoji icons for each prompt type
function getPromptIcon(promptId: string): string {
  const icons: Record<string, string> = {
    learning: '🎓',
    general: '💬',
    code: '💻',
    creative: '✨',
  };
  return icons[promptId] || '🤖';
}

// Export a simpler version for minimal UI
export function SimplePromptSelector() {
  const [selectedId, setSelectedId] = useState('learning');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const promptId = e.target.value;
    setSelectedId(promptId);
    unifiedAIService.setSystemPrompt(promptId);
    localStorage.setItem('preferredSystemPrompt', promptId);
  };

  return (
    <select
      value={selectedId}
      onChange={handleChange}
      className="simple-prompt-selector"
      aria-label="Select AI assistant mode"
    >
      {SYSTEM_PROMPTS.map((prompt) => (
        <option key={prompt.id} value={prompt.id}>
          {prompt.name}
        </option>
      ))}
    </select>
  );
}
