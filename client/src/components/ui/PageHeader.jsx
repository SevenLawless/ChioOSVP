function PageHeader({ eyebrow, title, children }) {
    return (
      <div className="page-header">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
        </div>
  
        {children && <div className="page-header-actions">{children}</div>}
      </div>
    );
  }
  
  export default PageHeader;