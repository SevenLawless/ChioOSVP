export function ErrorBanner({ message }) {
    if (!message) return null;
  
    return <div className="error-banner">{message}</div>;
  }
  
  export function SavePill({ message }) {
    if (!message) return null;
  
    return <span className="save-pill">{message}</span>;
  }