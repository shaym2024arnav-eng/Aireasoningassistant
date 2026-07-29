import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");

            const response = await loginUser(formData);

            localStorage.setItem("token", response.token);
            localStorage.setItem(
                "user",
                JSON.stringify(response.user)
            );

            navigate("/dashboard");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Login failed. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="enterprise-auth-page">

            <div className="auth-visual-panel">

                <div className="auth-brand">
                    <div className="auth-brand-mark">
                        S
                    </div>

                    <div>
                        <h2>Smart Reasoning</h2>
                        <span>AI Intelligence Workspace</span>
                    </div>
                </div>

                <div className="auth-visual-content">

                    <p className="auth-eyebrow">
                        INTELLIGENT REASONING PLATFORM
                    </p>

                    <h1>
                        Turn complex questions into clear,
                        structured decisions.
                    </h1>

                    <p>
                        Use specialized AI agents, knowledge retrieval,
                        and structured workflows to solve problems with
                        greater clarity.
                    </p>

                    <div className="auth-feature-grid">

                        <div className="auth-feature">
                            <strong>Multi-Agent</strong>
                            <span>Structured reasoning pipeline</span>
                        </div>

                        <div className="auth-feature">
                            <strong>Knowledge-Aware</strong>
                            <span>Wikipedia-powered factual context</span>
                        </div>

                        <div className="auth-feature">
                            <strong>Persistent</strong>
                            <span>Save and revisit reasoning history</span>
                        </div>

                    </div>

                </div>

            </div>


            <div className="auth-form-panel">

                <div className="enterprise-auth-card">

                    <div className="auth-card-header">
                        <span className="auth-status-dot"></span>

                        <p>
                            Secure Workspace Access
                        </p>
                    </div>

                    <h2>
                        Welcome back
                    </h2>

                    <p className="auth-card-subtitle">
                        Sign in to continue to your reasoning workspace.
                    </p>

                    <form onSubmit={handleSubmit}>

                        <div className="auth-field">
                            <label>Email</label>

                            <input
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>


                        <div className="auth-field">
                            <label>Password</label>

                            <input
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>


                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}


                        <button
                            type="submit"
                            className="enterprise-auth-btn"
                            disabled={loading}
                        >
                            {loading
                                ? "Signing in..."
                                : "Sign In"
                            }
                        </button>

                    </form>


                    <div className="enterprise-auth-link">

                        <span>
                            New to Smart Reasoning?
                        </span>

                        <Link to="/register">
                            Create account
                        </Link>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Login;