import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
function Dashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalSessions: 0,
        recentSessions: [],
        latestProblem: "No reasoning sessions yet"
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                                        `${API_BASE_URL}/api/reasoning/stats`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setStats(response.data);

            } catch (error) {
                console.error(
                    "Dashboard Stats Error:",
                    error
                );

            } finally {
                setLoading(false);
            }
        };

        fetchStats();

    }, []);

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    return (
        <div className="enterprise-dashboard">

            <div className="enterprise-header">

                <div>
                    <h1>
                        Welcome back, {user?.name || "Arnav"}
                    </h1>

                    <p>
                        Monitor your reasoning activity,
                        explore your agent workflow,
                        and start solving complex problems.
                    </p>
                </div>

                <div className="enterprise-status-chip">
                    System Operational
                </div>

            </div>


            <section className="enterprise-metrics">

                <div className="metric-card">

                    <div className="metric-label">
                        Total Sessions
                    </div>

                    <div className="metric-value">
                        {loading
                            ? "--"
                            : stats.totalSessions}
                    </div>

                    <div className="metric-description">
                        Reasoning sessions completed
                        by your workspace.
                    </div>

                </div>


                <div className="metric-card">

                    <div className="metric-label">
                        Recent Activity
                    </div>

                    <div className="metric-value">
                        {loading
                            ? "--"
                            : stats.recentSessions.length}
                    </div>

                    <div className="metric-description">
                        Latest reasoning sessions
                        currently in view.
                    </div>

                </div>


                <div className="metric-card">

                    <div className="metric-label">
                        Active Agents
                    </div>

                    <div className="metric-value">
                        6
                    </div>

                    <div className="metric-description">
                        Router, Decomposer, Planner,
                        Solver, Verifier, Explainer.
                    </div>

                </div>

            </section>


            <section className="enterprise-grid">

                <div className="enterprise-panel">

                    <div className="enterprise-panel-header">

                        <h3>
                            Workspace Actions
                        </h3>

                        <span>
                            Quick access
                        </span>

                    </div>


                    <div className="enterprise-action-grid">

                        <div className="enterprise-action-card">

                            <h4>
                                New Reasoning
                            </h4>

                            <p>
                                Start a new reasoning session
                                using the multi-agent pipeline.
                            </p>

                            <button
                                onClick={() =>
                                    navigate("/reasoning")
                                }
                            >
                                Start Reasoning
                            </button>

                        </div>


                        <div className="enterprise-action-card">

                            <h4>
                                Reasoning History
                            </h4>

                            <p>
                                Review saved problems,
                                reasoning steps, and outcomes.
                            </p>

                            <button
                                onClick={() =>
                                    navigate("/history")
                                }
                            >
                                Open History
                            </button>

                        </div>


                        <div className="enterprise-action-card">

                            <h4>
                                Agent System
                            </h4>

                            <p>
                                Explore how each specialized
                                agent contributes to reasoning.
                            </p>

                            <button
                                onClick={() =>
                                    navigate("/agents")
                                }
                            >
                                View Agents
                            </button>

                        </div>


                        <div className="enterprise-action-card">

                            <h4>
                                Latest Session
                            </h4>

                            <p>
                                Continue exploring your most
                                recent reasoning activity.
                            </p>

                            <button
                                onClick={() =>
                                    navigate("/history")
                                }
                            >
                                View Latest
                            </button>

                        </div>

                    </div>

                </div>


                <div className="enterprise-panel">

                    <div className="enterprise-panel-header">

                        <h3>
                            Latest Activity
                        </h3>

                        <span>
                            Live data
                        </span>

                    </div>


                    <div className="latest-problem-box">

                        {loading
                            ? "Loading..."
                            : stats.latestProblem
                        }

                    </div>


                    <div className="recent-list">

                        {stats.recentSessions
                            .slice(0, 3)
                            .map((session) => (

                                <div
                                    className="recent-item"
                                    key={session._id}
                                >

                                    <strong>
                                        {session.problem}
                                    </strong>

                                    <span>
                                        {new Date(
                                            session.createdAt
                                        ).toLocaleDateString()}
                                    </span>

                                </div>

                            ))
                        }

                    </div>

                </div>

            </section>

        </div>
    );
}

export default Dashboard;