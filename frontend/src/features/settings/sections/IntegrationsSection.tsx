/**
 * Integrations Section
 * 
 * Integrations for connecting to external services like Notion, Slack, GitHub, etc.
 * with OAuth support for multi-user apps.
 */

import { useState, useSyncExternalStore, useCallback } from "react"
import {
    Plug,
    ExternalLink,
    Check,
    X,
    RefreshCw,
    LogOut,
    AlertCircle,
    Loader2,
    ChevronRight,
    Sparkles,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Badge } from "@/shared/components/ui/badge"

// Storage keys
const NOTION_OAUTH_CONFIG_KEY = 'notion_oauth_config'
const NOTION_CONNECTION_KEY = 'notion_connection'

interface NotionOAuthAppConfig {
    clientId: string
    clientSecret: string
    redirectUri: string
}

interface NotionConnection {
    accessToken: string
    workspaceId: string
    workspaceName?: string
    workspaceIcon?: string
    botId: string
    connectedAt: string
    owner?: {
        type: 'user' | 'workspace'
        name?: string
        email?: string
    }
}

interface IntegrationCardProps {
    id: string
    name: string
    description: string
    icon: React.ReactNode
    category: string
    isConnected: boolean
    connectionInfo?: string
    isDarkTheme: boolean
    isLoading?: boolean
    onConnect: () => void
    onDisconnect: () => void
    capabilities?: string[]
}

function IntegrationCard({
    name,
    description,
    icon,
    category,
    isConnected,
    connectionInfo,
    isDarkTheme,
    isLoading,
    onConnect,
    onDisconnect,
    capabilities = [],
}: IntegrationCardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border p-4 transition-all duration-200",
                isDarkTheme
                    ? "border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 hover:border-zinc-700"
                    : "border-zinc-200 bg-gradient-to-br from-white to-zinc-50/50 hover:border-zinc-300",
                isConnected && (isDarkTheme
                    ? "ring-1 ring-emerald-500/20 border-emerald-500/30"
                    : "ring-1 ring-emerald-500/20 border-emerald-500/30"
                )
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg text-lg",
                        isDarkTheme
                            ? "bg-zinc-800 border border-zinc-700"
                            : "bg-zinc-100 border border-zinc-200"
                    )}>
                        {icon}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "font-semibold text-sm",
                                isDarkTheme ? "text-zinc-100" : "text-zinc-900"
                            )}>
                                {name}
                            </span>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[10px] h-5 px-1.5",
                                    isDarkTheme ? "border-zinc-700 text-zinc-400" : "border-zinc-200 text-zinc-500"
                                )}
                            >
                                {category}
                            </Badge>
                        </div>
                        <p className={cn(
                            "text-xs mt-0.5 line-clamp-2",
                            isDarkTheme ? "text-zinc-400" : "text-zinc-600"
                        )}>
                            {description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Capabilities */}
            {capabilities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {capabilities.map((cap) => (
                        <span
                            key={cap}
                            className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                                isDarkTheme
                                    ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                                    : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                            )}
                        >
                            <Sparkles className="h-2.5 w-2.5" />
                            {cap}
                        </span>
                    ))}
                </div>
            )}

            {/* Connection Status & Actions */}
            <div className={cn(
                "flex items-center justify-between mt-4 pt-3 border-t",
                isDarkTheme ? "border-zinc-800" : "border-zinc-100"
            )}>
                {isConnected ? (
                    <>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/20">
                                <Check className="h-3 w-3 text-emerald-500" />
                            </div>
                            <div>
                                <span className={cn(
                                    "text-xs font-medium",
                                    isDarkTheme ? "text-emerald-400" : "text-emerald-600"
                                )}>
                                    Connected
                                </span>
                                {connectionInfo && (
                                    <span className={cn(
                                        "text-[10px] block",
                                        isDarkTheme ? "text-zinc-500" : "text-zinc-500"
                                    )}>
                                        {connectionInfo}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDisconnect}
                            disabled={isLoading}
                            className={cn(
                                "h-8 gap-1.5",
                                isDarkTheme
                                    ? "text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                                    : "text-zinc-500 hover:text-red-500 hover:bg-red-50"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <LogOut className="h-3.5 w-3.5" />
                            )}
                            <span className="text-xs">Disconnect</span>
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "flex items-center justify-center h-5 w-5 rounded-full",
                                isDarkTheme ? "bg-zinc-800" : "bg-zinc-100"
                            )}>
                                <X className={cn("h-3 w-3", isDarkTheme ? "text-zinc-500" : "text-zinc-400")} />
                            </div>
                            <span className={cn(
                                "text-xs",
                                isDarkTheme ? "text-zinc-500" : "text-zinc-500"
                            )}>
                                Not connected
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onConnect}
                            disabled={isLoading}
                            className={cn(
                                "h-8 gap-1.5",
                                isDarkTheme
                                    ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                                    : "border-zinc-200 bg-white hover:bg-zinc-50"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <ExternalLink className="h-3.5 w-3.5" />
                            )}
                            <span className="text-xs">Connect</span>
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}

interface NotionSetupDialogProps {
    isDarkTheme: boolean
    isOpen: boolean
    onClose: () => void
    onSave: (config: NotionOAuthAppConfig) => void
    existingConfig?: NotionOAuthAppConfig | null
}

function NotionSetupDialog({
    isDarkTheme,
    isOpen,
    onClose,
    onSave,
    existingConfig,
}: NotionSetupDialogProps) {
    const [clientId, setClientId] = useState(existingConfig?.clientId || '')
    const [clientSecret, setClientSecret] = useState(existingConfig?.clientSecret || '')
    const [redirectUri, setRedirectUri] = useState(existingConfig?.redirectUri || 'http://localhost:5173/oauth/notion/callback')

    if (!isOpen) return null

    const handleSave = () => {
        if (clientId.trim() && clientSecret.trim() && redirectUri.trim()) {
            onSave({
                clientId: clientId.trim(),
                clientSecret: clientSecret.trim(),
                redirectUri: redirectUri.trim(),
            })
            onClose()
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Dialog */}
            <div
                className={cn(
                    "relative z-10 w-full max-w-lg mx-4 rounded-2xl border shadow-2xl",
                    isDarkTheme
                        ? "bg-zinc-900 border-zinc-800"
                        : "bg-white border-zinc-200"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={cn(
                    "flex items-center justify-between p-4 border-b",
                    isDarkTheme ? "border-zinc-800" : "border-zinc-100"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg text-lg",
                            isDarkTheme ? "bg-zinc-800" : "bg-zinc-100"
                        )}>
                            📓
                        </div>
                        <div>
                            <h3 className={cn(
                                "font-semibold",
                                isDarkTheme ? "text-zinc-100" : "text-zinc-900"
                            )}>
                                Setup Notion Integration
                            </h3>
                            <p className={cn(
                                "text-xs",
                                isDarkTheme ? "text-zinc-400" : "text-zinc-600"
                            )}>
                                Configure OAuth credentials for multi-user access
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            isDarkTheme ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500"
                        )}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Instructions */}
                    <div className={cn(
                        "rounded-lg p-3 space-y-2",
                        isDarkTheme ? "bg-blue-500/10 border border-blue-500/20" : "bg-blue-50 border border-blue-100"
                    )}>
                        <div className="flex items-start gap-2">
                            <AlertCircle className={cn("h-4 w-4 mt-0.5 flex-shrink-0", isDarkTheme ? "text-blue-400" : "text-blue-500")} />
                            <div className="text-xs space-y-1">
                                <p className={cn("font-medium", isDarkTheme ? "text-blue-300" : "text-blue-700")}>
                                    How to get your OAuth credentials:
                                </p>
                                <ol className={cn("list-decimal list-inside space-y-0.5", isDarkTheme ? "text-blue-400/80" : "text-blue-600/80")}>
                                    <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">notion.so/my-integrations</a></li>
                                    <li>Create a <strong>Public</strong> integration</li>
                                    <li>Add redirect URI below to your integration</li>
                                    <li>Copy the Client ID and Client Secret</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label className={cn("text-xs font-medium", isDarkTheme ? "text-zinc-300" : "text-zinc-700")}>
                                Client ID
                            </Label>
                            <Input
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                placeholder="Enter your OAuth Client ID"
                                className={cn(
                                    isDarkTheme && "bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className={cn("text-xs font-medium", isDarkTheme ? "text-zinc-300" : "text-zinc-700")}>
                                Client Secret
                            </Label>
                            <Input
                                type="password"
                                value={clientSecret}
                                onChange={(e) => setClientSecret(e.target.value)}
                                placeholder="Enter your OAuth Client Secret"
                                className={cn(
                                    isDarkTheme && "bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className={cn("text-xs font-medium", isDarkTheme ? "text-zinc-300" : "text-zinc-700")}>
                                Redirect URI
                            </Label>
                            <Input
                                value={redirectUri}
                                onChange={(e) => setRedirectUri(e.target.value)}
                                placeholder="http://localhost:5173/oauth/notion/callback"
                                className={cn(
                                    isDarkTheme && "bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                                )}
                            />
                            <p className={cn("text-[10px]", isDarkTheme ? "text-zinc-500" : "text-zinc-500")}>
                                Add this exact URI to your Notion integration's OAuth settings
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={cn(
                    "flex items-center justify-end gap-2 p-4 border-t",
                    isDarkTheme ? "border-zinc-800" : "border-zinc-100"
                )}>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className={cn(isDarkTheme && "text-zinc-400 hover:bg-zinc-800")}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!clientId.trim() || !clientSecret.trim() || !redirectUri.trim()}
                        className={cn(
                            "gap-1.5",
                            isDarkTheme
                                ? "bg-blue-600 hover:bg-blue-500 text-white"
                                : "bg-blue-600 hover:bg-blue-500 text-white"
                        )}
                    >
                        <Check className="h-4 w-4" />
                        Save & Continue
                    </Button>
                </div>
            </div>
        </div>
    )
}

export function IntegrationsSection({ isDarkTheme = false }: { isDarkTheme?: boolean }) {
    const [notionConfig, setNotionConfig] = useState<NotionOAuthAppConfig | null>(null)
    const [notionConnection, setNotionConnection] = useState<NotionConnection | null>(null)
    const [showNotionSetup, setShowNotionSetup] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [oauthError, setOauthError] = useState<string | null>(null)

    // Load saved config and connection - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            try {
                const savedConfig = localStorage.getItem(NOTION_OAUTH_CONFIG_KEY)
                if (savedConfig) {
                    setNotionConfig(JSON.parse(savedConfig))
                }

                const savedConnection = localStorage.getItem(NOTION_CONNECTION_KEY)
                if (savedConnection) {
                    setNotionConnection(JSON.parse(savedConnection))
                }
            } catch (e) {
                console.error('Failed to load Notion config:', e)
            }
            return () => {}
        }, []),
        () => null,
        () => null
    )

    // Listen for OAuth callback - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            const handleOAuthCallback = async (event: MessageEvent) => {
                if (event.data?.type === 'notion-oauth-callback') {
                    const { code, error } = event.data

                    if (error) {
                        setOauthError(error)
                        setIsConnecting(false)
                        return
                    }

                    if (code && notionConfig) {
                        await exchangeCodeForToken(code)
                    }
                }
            }

            window.addEventListener('message', handleOAuthCallback)
            return () => window.removeEventListener('message', handleOAuthCallback)
        }, [notionConfig]),
        () => null,
        () => null
    )

    // Check URL for OAuth callback - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            const params = new URLSearchParams(window.location.search)
            const code = params.get('code')
            const error = params.get('error')
            const state = params.get('state')

            if (state?.startsWith('notion-oauth-') && notionConfig) {
                if (error) {
                    setOauthError(error)
                    window.history.replaceState({}, document.title, window.location.pathname)
                } else if (code) {
                    exchangeCodeForToken(code).then(() => {
                        window.history.replaceState({}, document.title, window.location.pathname)
                    })
                }
            }
            return () => {}
        }, [notionConfig]),
        () => null,
        () => null
    )

    const saveNotionConfig = useCallback((config: NotionOAuthAppConfig) => {
        setNotionConfig(config)
        localStorage.setItem(NOTION_OAUTH_CONFIG_KEY, JSON.stringify(config))
    }, [])

    const exchangeCodeForToken = async (code: string) => {
        if (!notionConfig) return

        setIsConnecting(true)
        setOauthError(null)

        try {
            // Exchange code for token
            const basicAuth = btoa(`${notionConfig.clientId}:${notionConfig.clientSecret}`)

            const response = await fetch('https://api.notion.com/v1/oauth/token', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${basicAuth}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: notionConfig.redirectUri,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error_description || errorData.error || 'Failed to exchange token')
            }

            const data = await response.json()

            const connection: NotionConnection = {
                accessToken: data.access_token,
                workspaceId: data.workspace_id,
                workspaceName: data.workspace_name,
                workspaceIcon: data.workspace_icon,
                botId: data.bot_id,
                connectedAt: new Date().toISOString(),
                owner: data.owner ? {
                    type: data.owner.type,
                    name: data.owner.user?.name,
                    email: data.owner.user?.person?.email,
                } : undefined,
            }

            setNotionConnection(connection)
            localStorage.setItem(NOTION_CONNECTION_KEY, JSON.stringify(connection))
        } catch (e) {
            console.error('OAuth error:', e)
            setOauthError(e instanceof Error ? e.message : 'Failed to connect to Notion')
        } finally {
            setIsConnecting(false)
        }
    }

    const handleNotionConnect = useCallback(() => {
        if (!notionConfig) {
            setShowNotionSetup(true)
            return
        }

        setIsConnecting(true)
        setOauthError(null)

        // Generate state for CSRF protection
        const state = `notion-oauth-${crypto.randomUUID()}`

        // Build authorization URL
        const params = new URLSearchParams({
            client_id: notionConfig.clientId,
            redirect_uri: notionConfig.redirectUri,
            response_type: 'code',
            owner: 'user',
            state,
        })

        const authUrl = `https://api.notion.com/v1/oauth/authorize?${params.toString()}`

        // Open in popup or redirect
        const width = 600
        const height = 700
        const left = window.screenX + (window.outerWidth - width) / 2
        const top = window.screenY + (window.outerHeight - height) / 2

        const popup = window.open(
            authUrl,
            'notion-oauth',
            `width=${width},height=${height},left=${left},top=${top},popup=yes`
        )

        // If popup was blocked, redirect instead
        if (!popup) {
            window.location.href = authUrl
        }
    }, [notionConfig])

    const handleNotionDisconnect = useCallback(() => {
        setNotionConnection(null)
        localStorage.removeItem(NOTION_CONNECTION_KEY)
    }, [])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className={cn(
                    "flex items-center gap-2 text-sm font-medium",
                    isDarkTheme ? "text-zinc-100" : "text-zinc-900"
                )}>
                    <Plug className="h-4 w-4" />
                    Integrations
                </div>
                <p className={cn("text-xs mt-1", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
                    Connect external services to extend AI capabilities.
                </p>
            </div>

            {/* OAuth Error */}
            {oauthError && (
                <div className={cn(
                    "flex items-start gap-2 p-3 rounded-lg",
                    isDarkTheme
                        ? "bg-red-500/10 border border-red-500/20 text-red-400"
                        : "bg-red-50 border border-red-100 text-red-600"
                )}>
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                        <p className="font-medium">Connection Failed</p>
                        <p className="opacity-80">{oauthError}</p>
                    </div>
                    <button
                        onClick={() => setOauthError(null)}
                        className="ml-auto p-1 hover:opacity-70"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Integrations Grid */}
            <div className="space-y-3">
                {/* Notion */}
                <IntegrationCard
                    id="notion"
                    name="Notion"
                    description="Access and manage Notion pages, databases, and content directly through AI."
                    icon={<span>📓</span>}
                    category="Productivity"
                    isConnected={!!notionConnection}
                    connectionInfo={notionConnection?.workspaceName || notionConnection?.workspaceId}
                    isDarkTheme={isDarkTheme}
                    isLoading={isConnecting}
                    onConnect={() => {
                        if (!notionConfig) {
                            setShowNotionSetup(true)
                        } else {
                            handleNotionConnect()
                        }
                    }}
                    onDisconnect={handleNotionDisconnect}
                    capabilities={['Read Pages', 'Create Content', 'Search', 'Databases']}
                />

                {/* More integrations coming soon */}
                <div className={cn(
                    "rounded-xl border-2 border-dashed p-6 text-center",
                    isDarkTheme ? "border-zinc-800" : "border-zinc-200"
                )}>
                    <div className="flex items-center justify-center gap-4 mb-3">
                        <span className="text-2xl opacity-50">💬</span>
                        <span className="text-2xl opacity-50">🐙</span>
                        <span className="text-2xl opacity-50">📁</span>
                    </div>
                    <p className={cn(
                        "text-sm font-medium",
                        isDarkTheme ? "text-zinc-400" : "text-zinc-600"
                    )}>
                        More integrations coming soon
                    </p>
                    <p className={cn(
                        "text-xs mt-1",
                        isDarkTheme ? "text-zinc-500" : "text-zinc-500"
                    )}>
                        Slack, GitHub, Google Drive, and more...
                    </p>
                </div>
            </div>

            {/* Connected Integration Details */}
            {notionConnection && (
                <div className={cn(
                    "rounded-xl border p-4 space-y-3",
                    isDarkTheme ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50/50"
                )}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📓</span>
                            <span className={cn(
                                "text-sm font-medium",
                                isDarkTheme ? "text-zinc-100" : "text-zinc-900"
                            )}>
                                Notion Workspace
                            </span>
                        </div>
                        <Badge className={cn(
                            "text-[10px]",
                            isDarkTheme ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                        )}>
                            Active
                        </Badge>
                    </div>

                    <div className={cn(
                        "rounded-lg p-3 space-y-2",
                        isDarkTheme ? "bg-zinc-800/50" : "bg-white"
                    )}>
                        <div className="flex items-center gap-2">
                            {notionConnection.workspaceIcon ? (
                                <img
                                    src={notionConnection.workspaceIcon}
                                    alt=""
                                    className="h-8 w-8 rounded"
                                />
                            ) : (
                                <div className={cn(
                                    "h-8 w-8 rounded flex items-center justify-center text-lg",
                                    isDarkTheme ? "bg-zinc-700" : "bg-zinc-100"
                                )}>
                                    📓
                                </div>
                            )}
                            <div>
                                <p className={cn(
                                    "text-sm font-medium",
                                    isDarkTheme ? "text-zinc-100" : "text-zinc-900"
                                )}>
                                    {notionConnection.workspaceName || 'Notion Workspace'}
                                </p>
                                <p className={cn(
                                    "text-xs",
                                    isDarkTheme ? "text-zinc-500" : "text-zinc-500"
                                )}>
                                    Connected {new Date(notionConnection.connectedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {notionConnection.owner?.name && (
                            <p className={cn("text-xs", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
                                Connected by: {notionConnection.owner.name}
                                {notionConnection.owner.email && ` (${notionConnection.owner.email})`}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNotionConnect}
                            disabled={isConnecting}
                            className={cn(
                                "h-8 gap-1.5 flex-1",
                                isDarkTheme && "border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                            )}
                        >
                            <RefreshCw className={cn("h-3.5 w-3.5", isConnecting && "animate-spin")} />
                            <span className="text-xs">Reconnect</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowNotionSetup(true)}
                            className={cn(
                                "h-8 gap-1.5",
                                isDarkTheme && "border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                            )}
                        >
                            <span className="text-xs">Settings</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}



            {/* Setup Dialog */}
            <NotionSetupDialog
                isDarkTheme={isDarkTheme}
                isOpen={showNotionSetup}
                onClose={() => setShowNotionSetup(false)}
                onSave={saveNotionConfig}
                existingConfig={notionConfig}
            />
        </div>
    )
}
