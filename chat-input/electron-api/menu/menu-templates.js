/**
 * Menu Templates for SonicPlane Application
 * Contains pre-built menu templates for different contexts and use cases
 */

const { shell } = require('electron');

class MenuTemplates {
    /**
     * Floating chat window menu template
     */
    static getFloatingChatMenu() {
        return [
            {
                label: 'Chat',
                submenu: [
                    {
                        label: 'New Chat',
                        accelerator: 'CmdOrCtrl+N',
                        click: () => this.emit('new-chat')
                    },
                    {
                        label: 'Clear Chat',
                        accelerator: 'CmdOrCtrl+K',
                        click: () => this.emit('clear-chat')
                    },
                    { type: 'separator' },
                    {
                        label: 'Export Chat',
                        click: () => this.emit('export-chat')
                    },
                    { type: 'separator' },
                    {
                        label: 'Close',
                        accelerator: 'CmdOrCtrl+W',
                        role: 'close'
                    }
                ]
            },
            {
                label: 'AI',
                submenu: [
                    {
                        label: 'Start Screen Capture',
                        accelerator: 'CmdOrCtrl+Shift+S',
                        click: () => this.emit('start-screen-capture')
                    },
                    {
                        label: 'Voice Input',
                        accelerator: 'CmdOrCtrl+Shift+V',
                        click: () => this.emit('voice-input')
                    }
                ]
            },
            {
                label: 'View',
                submenu: [
                    {
                        label: 'Stay on Top',
                        type: 'checkbox',
                        checked: false,
                        click: (menuItem) => this.emit('toggle-always-on-top', menuItem.checked)
                    },
                    {
                        label: 'Hide in Dock',
                        type: 'checkbox',
                        checked: false,
                        click: (menuItem) => this.emit('toggle-dock-visibility', !menuItem.checked)
                    },
                    { type: 'separator' },
                    { role: 'toggleDevTools' }
                ]
            }
        ];
    }

    /**
     * Screen capture menu template
     */
    static getScreenCaptureMenu() {
        return [
            {
                label: 'Capture',
                submenu: [
                    {
                        label: 'Start Recording',
                        accelerator: 'CmdOrCtrl+R',
                        click: () => this.emit('start-recording')
                    },
                    {
                        label: 'Stop Recording',
                        accelerator: 'CmdOrCtrl+Shift+R',
                        click: () => this.emit('stop-recording')
                    },
                    { type: 'separator' },
                    {
                        label: 'Take Screenshot',
                        accelerator: 'CmdOrCtrl+Shift+3',
                        click: () => this.emit('take-screenshot')
                    },
                    { type: 'separator' },
                    {
                        label: 'Select Area',
                        accelerator: 'CmdOrCtrl+Shift+4',
                        click: () => this.emit('select-area')
                    }
                ]
            },
            {
                label: 'Settings',
                submenu: [
                    {
                        label: 'Video Quality',
                        submenu: [
                            {
                                label: 'Low (720p)',
                                type: 'radio',
                                click: () => this.emit('set-quality', '720p')
                            },
                            {
                                label: 'Medium (1080p)',
                                type: 'radio',
                                checked: true,
                                click: () => this.emit('set-quality', '1080p')
                            },
                            {
                                label: 'High (4K)',
                                type: 'radio',
                                click: () => this.emit('set-quality', '4k')
                            }
                        ]
                    },
                    {
                        label: 'Frame Rate',
                        submenu: [
                            {
                                label: '30 FPS',
                                type: 'radio',
                                checked: true,
                                click: () => this.emit('set-framerate', 30)
                            },
                            {
                                label: '60 FPS',
                                type: 'radio',
                                click: () => this.emit('set-framerate', 60)
                            }
                        ]
                    }
                ]
            }
        ];
    }

    /**
     * Chat input context menu
     */
    static getChatInputContext() {
        return [
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { type: 'separator' },
            { role: 'selectall' },
            { type: 'separator' },
            {
                label: 'Clear Input',
                click: () => this.emit('clear-input')
            },
            { type: 'separator' },
            {
                label: 'Insert Template',
                submenu: [
                    {
                        label: 'Code Review Template',
                        click: () => this.emit('insert-template', {
                            type: 'code-review',
                            template: 'Please review the following code:\n\n```\n[Paste your code here]\n```\n\nSpecific areas of concern:\n- \n\nExpected behavior:\n- '
                        })
                    },
                    {
                        label: 'Bug Report Template',
                        click: () => this.emit('insert-template', {
                            type: 'bug-report',
                            template: '**Bug Description:**\n\n**Steps to Reproduce:**\n1. \n\n**Expected Behavior:**\n\n**Actual Behavior:**\n\n**Environment:**\n- OS: \n- Browser: \n- Version: '
                        })
                    },
                    {
                        label: 'Explain Code Template',
                        click: () => this.emit('insert-template', {
                            type: 'explain-code',
                            template: 'Please explain the following code in detail:\n\n```\n[Paste your code here]\n```\n\nSpecifically, I would like to understand:\n- '
                        })
                    }
                ]
            },
            { type: 'separator' },
            {
                label: 'Voice Input',
                accelerator: 'CmdOrCtrl+Shift+V',
                click: () => this.emit('voice-input')
            }
        ];
    }

    /**
     * Chat message context menu
     */
    static getChatMessageContext() {
        return [
            {
                label: 'Copy Message',
                accelerator: 'CmdOrCtrl+C',
                click: () => this.emit('copy-message')
            },
            {
                label: 'Copy as Code',
                click: () => this.emit('copy-as-code')
            },
            {
                label: 'Copy as Markdown',
                click: () => this.emit('copy-as-markdown')
            },
            { type: 'separator' },
            {
                label: 'Regenerate Response',
                accelerator: 'CmdOrCtrl+R',
                click: () => this.emit('regenerate-response')
            },
            {
                label: 'Continue Response',
                click: () => this.emit('continue-response')
            },
            { type: 'separator' },
            {
                label: 'Edit Message',
                click: () => this.emit('edit-message')
            },
            {
                label: 'Quote Message',
                click: () => this.emit('quote-message')
            },
            { type: 'separator' },
            {
                label: 'Export Message',
                submenu: [
                    {
                        label: 'Export as Text',
                        click: () => this.emit('export-message', 'text')
                    },
                    {
                        label: 'Export as Markdown',
                        click: () => this.emit('export-message', 'markdown')
                    },
                    {
                        label: 'Export as PDF',
                        click: () => this.emit('export-message', 'pdf')
                    }
                ]
            },
            { type: 'separator' },
            {
                label: 'Delete Message',
                accelerator: 'Delete',
                click: () => this.emit('delete-message')
            }
        ];
    }

    /**
     * Code block context menu
     */
    static getCodeBlockContext() {
        return [
            {
                label: 'Copy Code',
                accelerator: 'CmdOrCtrl+C',
                click: () => this.emit('copy-code')
            },
            {
                label: 'Copy with Language',
                click: () => this.emit('copy-code-with-language')
            },
            { type: 'separator' },
            {
                label: 'Save as File',
                click: () => this.emit('save-code-as-file')
            },
            {
                label: 'Run Code',
                click: () => this.emit('run-code')
            },
            { type: 'separator' },
            {
                label: 'Explain Code',
                click: () => this.emit('explain-code')
            },
            {
                label: 'Optimize Code',
                click: () => this.emit('optimize-code')
            },
            {
                label: 'Add Comments',
                click: () => this.emit('add-comments')
            }
        ];
    }

    /**
     * Tray menu template
     */
    static getTrayMenu() {
        return [
            {
                label: 'Open SonicPlane',
                click: () => this.emit('show-main-window')
            },
            {
                label: 'Quick Chat',
                accelerator: 'CmdOrCtrl+Shift+Space',
                click: () => this.emit('show-quick-chat')
            },
            { type: 'separator' },
            {
                label: 'Screen Capture',
                click: () => this.emit('start-screen-capture')
            },
            {
                label: 'Voice Input',
                click: () => this.emit('voice-input')
            },
            { type: 'separator' },
            {
                label: 'Settings',
                click: () => this.emit('show-settings')
            },
            { type: 'separator' },
            {
                label: 'Quit SonicPlane',
                accelerator: 'CmdOrCtrl+Q',
                click: () => this.emit('quit-app')
            }
        ];
    }

    /**
     * Developer menu template
     */
    static getDeveloperMenu() {
        return [
            {
                label: 'Developer',
                submenu: [
                    { role: 'reload' },
                    { role: 'forceReload' },
                    { role: 'toggleDevTools' },
                    { type: 'separator' },
                    {
                        label: 'Open Config Directory',
                        click: async () => {
                            const { app } = require('electron');
                            const path = require('path');
                            await shell.openPath(app.getPath('userData'));
                        }
                    },
                    {
                        label: 'Open Log Files',
                        click: async () => {
                            const { app } = require('electron');
                            const path = require('path');
                            await shell.openPath(path.join(app.getPath('userData'), 'logs'));
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Clear Cache',
                        click: () => this.emit('clear-cache')
                    },
                    {
                        label: 'Reset Settings',
                        click: () => this.emit('reset-settings')
                    }
                ]
            }
        ];
    }

    /**
     * Emit event helper
     */
    static emit(event, data = null) {
        if (this.eventHandlers && this.eventHandlers[event]) {
            this.eventHandlers[event](data);
        }
    }

    /**
     * Set event handlers
     */
    static setEventHandlers(handlers) {
        this.eventHandlers = handlers;
    }
}

module.exports = MenuTemplates;