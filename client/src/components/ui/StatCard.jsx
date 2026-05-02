function StatCard({ label, value, hint, variant = "default" }) {
    return (
      <div className={`shared-stat-card ${variant}`}>
        <p>{label}</p>
        <h3>{value}</h3>
        {hint && <span>{hint}</span>}
      </div>
    );
  }
  
  export default StatCard;