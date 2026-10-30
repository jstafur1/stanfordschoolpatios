"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  onReset: () => void;
};

type State = {
  hasError: boolean;
};

/**
 * Catches render errors in server-action forms (e.g. body size limit 413)
 * so the dialog shell does not stay open with empty content.
 */
export class ActionFormErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(): void {
    this.props.onReset();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
