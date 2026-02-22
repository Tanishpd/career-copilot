import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Resume Builder Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-xl text-center text-danger">
                    <h2>Something went wrong in the Resume Builder.</h2>
                    <details className="text-left bg-gray-100 p-md rounded mt-md whitespace-pre-wrap">
                        <summary>Error Details</summary>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        className="btn btn-primary mt-lg"
                        onClick={() => {
                            localStorage.removeItem('resumeDraft');
                            window.location.reload();
                        }}
                    >
                        Reset Resume Data (Fix Crash)
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
