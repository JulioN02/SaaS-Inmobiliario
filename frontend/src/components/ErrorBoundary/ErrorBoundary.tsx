/* =============================================================================
   SaaS Inmobiliario — ErrorBoundary
   Captura errores de renderizado en componentes hijos y muestra un fallback UI
   ============================================================================= */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

// ── Types ───────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI to render instead of the default */
  fallback?: ReactNode;
  /** Callback invoked when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ── Component ───────────────────────────────────────────────────────────────

/**
 * ErrorBoundary — React class component that catches JavaScript errors
 * anywhere in its child component tree, logs those errors, and displays
 * a fallback UI instead of the crashed component tree.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyPage />
 * </ErrorBoundary>
 * ```
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={<CustomErrorUI />}
 *   onError={(error, info) => trackError(error, info)}
 * >
 *   <MyPage />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Error capturado:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  /** Reset the error state to retry rendering children */
  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, render it instead of the default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // ── Default fallback UI ──────────────────────────────────────────
      return (
        <div className={styles.container}>
          <div className={styles.card}>
            <span className={styles.icon} aria-hidden="true">⚠️</span>
            <h1 className={styles.title}>Algo salió mal</h1>
            <p className={styles.description}>
              Ocurrió un error inesperado al cargar esta página.
              Por favor, intenta de nuevo.
            </p>

            {/* Error details — only in development mode */}
            {import.meta.env.DEV && this.state.error && (
              <details className={styles.details}>
                <summary className={styles.detailsSummary}>
                  Detalles del error
                </summary>
                <pre className={styles.errorMessage}>
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className={styles.actions}>
              <button
                onClick={this.handleReset}
                className={styles.retryButton}
                type="button"
              >
                Reintentar
              </button>
              <a href="/dashboard" className={styles.homeLink}>
                Volver al inicio
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
export default ErrorBoundary;
