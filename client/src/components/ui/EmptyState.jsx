function EmptyState({ title, message, children }) {
    return (
      <div className="shared-empty-state">
        {title && <h3>{title}</h3>}
        {message && <p>{message}</p>}
        {children}
      </div>
    );
  }
  
  export default EmptyState;