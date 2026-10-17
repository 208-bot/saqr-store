import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white p-6" dir="rtl">
          <div className="max-w-md text-center">
            <div className="text-4xl font-bold text-neutral-900 mb-4">SAQR STORE</div>
            <p className="text-neutral-600 mb-2">
              حدث خطأ أثناء تحميل الموقع. حاول تحديث الصفحة.
            </p>
            <p className="text-neutral-400 text-sm mb-6 break-words">{this.state.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-neutral-900 text-white rounded-full font-medium hover:bg-neutral-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
