import { useLocation, useNavigate } from "react-router-dom";

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { label: "Overview", path: "/dashboard" },
        { label: "New Reasoning", path: "/reasoning" },
        { label: "History", path: "/history" },
        { label: "Agent System", path: "/agents" }
    ];

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <aside className="app-sidebar">
            <div className="sidebar-brand">
                <div className="brand-mark">S</div>

                <div>
                    <h2>Smart Reasoning</h2>
                    <span>AI Workspace</span>
                </div>
            </div>

            <div className="sidebar-section-label">
                WORKSPACE
            </div>

            <nav className="sidebar-navigation">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        className={
                            location.pathname === item.path
                                ? "sidebar-link active"
                                : "sidebar-link"
                        }
                        onClick={() => navigate(item.path)}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="sidebar-bottom">
                <div className="sidebar-status">
                    <span className="status-dot"></span>

                    <div>
                        <strong>System Online</strong>
                        <small>All agents operational</small>
                    </div>
                </div>

                <button
                    className="sidebar-logout"
                    onClick={handleLogout}
                >
                    Log out
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;