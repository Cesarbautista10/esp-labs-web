import { Component, type ErrorInfo, type ReactNode } from "react";
import { createLogger, errorData } from "@/lib/logger";
import styles from "./ErrorBoundary.module.css";

const log = createLogger("ui");

interface Props {
  /** Names the region in logs and in the fallback, e.g. "Preview R3". */
  name: string;
  children: ReactNode;
  /** Changing it clears a caught error (e.g. a new lesson id). */
  resetKey?: unknown;
}

interface State {
  error: Error | null;
  resetKey: unknown;
}

/**
 * Keeps one broken simulator from taking the whole lesson down. React still needs a class for
 * this; it is the only one in the app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    log.error(`${this.props.name} crashed`, {
      ...errorData(error),
      componentStack: info.componentStack,
    });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className={styles.fallback}>
        <p>
          <b>{this.props.name}</b> stopped working: {this.state.error.message}
        </p>
        <button type="button" onClick={() => this.setState({ error: null })}>
          Try again
        </button>
      </div>
    );
  }
}
