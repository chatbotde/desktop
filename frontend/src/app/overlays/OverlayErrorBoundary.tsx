import { Component, type ErrorInfo, type ReactNode } from 'react'

interface OverlayErrorBoundaryProps {
  overlayId: string
  children: ReactNode
}

interface OverlayErrorBoundaryState {
  error: Error | null
}

/**
 * Isolates a single overlay failure so the rest of the app keeps running.
 */
export class OverlayErrorBoundary extends Component<
  OverlayErrorBoundaryProps,
  OverlayErrorBoundaryState
> {
  state: OverlayErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): OverlayErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[OverlayErrorBoundary] "${this.props.overlayId}" crashed:`,
      error,
      info.componentStack,
    )
  }

  private handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div
        className="pointer-events-auto fixed bottom-4 left-4 z-[9999] max-w-sm rounded-lg border border-red-500/40 bg-black/80 px-3 py-2 text-xs text-red-100 shadow-lg"
        role="alert"
      >
        <p className="font-medium">Overlay failed: {this.props.overlayId}</p>
        <p className="mt-1 opacity-80 line-clamp-2">{error.message}</p>
        <button
          type="button"
          className="mt-2 rounded bg-red-500/30 px-2 py-1 hover:bg-red-500/50"
          onClick={this.handleRetry}
        >
          Retry
        </button>
      </div>
    )
  }
}
