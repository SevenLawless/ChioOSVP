function Panel({ eyebrow, title, right, children, className = "" }) {
    return (
      <div className={`shared-panel ${className}`}>
        {(eyebrow || title || right) && (
          <div className="panel-title-row">
            <div>
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              {title && <h3>{title}</h3>}
            </div>
  
            {right && <div className="panel-right">{right}</div>}
          </div>
        )}
  
        {children}
      </div>
    );
  }
  
  export default Panel;