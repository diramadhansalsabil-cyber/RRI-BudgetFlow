import { NavLink } from 'react-router-dom';

export default function Sidebar({ items, collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-logo">RRI</div>
        {!collapsed && (
          <div>
            <span className="sidebar-brand-name">BudgetFlow</span>
            <span className="sidebar-brand-tag">Enterprise</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <button type="button" className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
        {collapsed ? '→' : '←'}
      </button>
    </aside>
  );
}
