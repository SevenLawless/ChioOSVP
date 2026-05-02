import { NavLink } from "react-router-dom";
import chioosLogo from "../../assets/branding/chioos-logo.png";
import { navItems } from "../../config/navigation";

function Sidebar() {
  const groupedNavItems = navItems.reduce((groups, item) => {
    if (!groups[item.group]) {
      groups[item.group] = [];
    }

    groups[item.group].push(item);
    return groups;
  }, {});

  return (
    <aside className="sidebar">
      <div className="brand">
        <img className="brand-logo" src={chioosLogo} alt="ChioOS logo" />

        <div>
          <h1>ChioOS</h1>
          <p>Life OSed</p>
        </div>
      </div>

      <nav className="nav-list">
        {Object.entries(groupedNavItems).map(([groupName, items]) => (
          <div key={groupName} className="nav-group">
            <p className="nav-group-title">{groupName}</p>

            {items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink key={item.path} to={item.path} className="nav-link">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">

        <div className="sidebar-note">
          <span>Local-first ChioOS. System still in development.</span>
        </div>

        <div className="sidebar-contact">
          <span>7lawless25@gmail.com</span>
        </div>

        <div className="sidebar-contact">
        <span>https://github.com/SevenLawless</span>
        </div>


        
      </div>
    </aside>
  );
}

export default Sidebar;