import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
function Reasoning() {
    const navigate = useNavigate();

    const [problem, setProblem] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!problem.trim()) {
            setError("Please enter a problem.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setResult(null);

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/");
                return;
            }

            const response = await axios.post(
                               `${API_BASE_URL}/api/reasoning/create`,
                {
                    problem: problem.trim()
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setResult(response.data.reasoning);

        } catch (err) {
            console.error("Reasoning Error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to generate reasoning."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="enterprise-reasoning-page">

            <div className="enterprise-page-header">

                <div>
                    <p className="enterprise-page-eyebrow">
                        REASONING WORKSPACE
                    </p>

                    <h1>
                        Analyze complex problems
                    </h1>

                    <p>
                        Submit a question and let the multi-agent system
                        retrieve knowledge, decompose the problem, create
                        a plan, verify the solution, and generate a clear answer.
                    </p>
                </div>

                <div className="enterprise-status-chip">
                    6 Agents Active
                </div>

            </div>


            <div className="reasoning-workspace-grid">

                <section className="reasoning-input-panel">

                    <div className="enterprise-panel-header">

                        <div>
                            <h3>
                                New Reasoning Session
                            </h3>

                            <span>
                                Enter a factual, planning, or project question
                            </span>
                        </div>

                    </div>


                    <form
                        className="enterprise-reasoning-form"
                        onSubmit={handleSubmit}
                    >

                        <textarea
                            value={problem}
                            onChange={(e) => {
                                setProblem(e.target.value);
                                setError("");
                            }}
                            placeholder="Example: Explain quantum computing or How can I prepare for an SDE interview?"
                            required
                        />

                        <div className="reasoning-form-footer">

                            <span>
                                The router automatically selects the best reasoning path.
                            </span>

                            <button
                                type="submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Processing..."
                                    : "Run Analysis"
                                }
                            </button>

                        </div>

                    </form>


                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                </section>


                <aside className="reasoning-info-panel">

                    <div className="enterprise-panel-header">

                        <h3>
                            Reasoning Pipeline
                        </h3>

                        <span>
                            Live workflow
                        </span>

                    </div>


                    <div className="reasoning-pipeline-list">

                        {[
                            "Router",
                            "Decomposer",
                            "Planner",
                            "Solver",
                            "Verifier",
                            "Explainer"
                        ].map((agent, index) => (

                            <div
                                className="pipeline-item"
                                key={agent}
                            >
                                <div className="pipeline-number">
                                    {index + 1}
                                </div>

                                <div>
                                    <strong>
                                        {agent}
                                    </strong>

                                    <span>
                                        {index === 0
                                            ? "Classifies the question"
                                            : index === 1
                                                ? "Breaks the problem into parts"
                                                : index === 2
                                                    ? "Builds a structured plan"
                                                    : index === 3
                                                        ? "Generates the solution"
                                                        : index === 4
                                                            ? "Checks consistency"
                                                            : "Creates the final explanation"
                                        }
                                    </span>
                                </div>

                            </div>

                        ))}

                    </div>

                </aside>

            </div>


            {result && (

                <section className="enterprise-result-panel">

                    <div className="enterprise-panel-header">

                        <div>
                            <h3>
                                Analysis Result
                            </h3>

                            <span>
                                Generated by the multi-agent reasoning pipeline
                            </span>
                        </div>

                        {result.routeType && (
                            <div className="result-type-badge">
                                {result.routeType}
                            </div>
                        )}

                    </div>


                    {result.sourceTitle && (
                        <div className="knowledge-source-box">

                            <span>
                                Knowledge Source
                            </span>

                            <strong>
                                Wikipedia · {result.sourceTitle}
                            </strong>

                        </div>
                    )}


                    <div className="enterprise-result-grid">

                        <div className="result-panel-block">

                            <span className="result-block-label">
                                Problem
                            </span>

                            <p>
                                {result.problem}
                            </p>

                        </div>


                        <div className="result-panel-block">

                            <span className="result-block-label">
                                Breakdown
                            </span>

                            <ol>
                                {result.breakdown?.map(
                                    (item, index) => (
                                        <li key={index}>
                                            {item}
                                        </li>
                                    )
                                )}
                            </ol>

                        </div>


                        <div className="result-panel-block">

                            <span className="result-block-label">
                                Plan
                            </span>

                            <ol>
                                {result.plan?.map(
                                    (item, index) => (
                                        <li key={index}>
                                            {item}
                                        </li>
                                    )
                                )}
                            </ol>

                        </div>


                        <div className="result-panel-block result-panel-wide">

                            <span className="result-block-label">
                                Solution
                            </span>

                            <p>
                                {result.solution}
                            </p>

                        </div>


                        <div className="result-panel-block">

                            <span className="result-block-label">
                                Verification
                            </span>

                            <p>
                                {result.verification}
                            </p>

                        </div>


                        <div className="result-panel-block">

                            <span className="result-block-label">
                                Final Answer
                            </span>

                            <p>
                                {result.finalAnswer}
                            </p>

                        </div>

                    </div>

                </section>

            )}

        </div>
    );
}

export default Reasoning;