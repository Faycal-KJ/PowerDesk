import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  name?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? ` — ${this.props.name}` : ''}]`, error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: 24,
          color: 'var(--text-secondary)',
          fontSize: 13,
          textAlign: 'center',
          height: '100%',
        }}>
          <div style={{ fontSize: 24, opacity: 0.6 }}>&#9888;</div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {this.props.name || 'Something'} crashed
          </div>
          <div style={{ maxWidth: 400, lineHeight: 1.5, color: 'var(--text-muted)' }}>
            {this.state.error?.message}
          </div>
          <button
            onClick={this.handleReset}
            style={{
              marginTop: 4,
              padding: '6px 16px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
