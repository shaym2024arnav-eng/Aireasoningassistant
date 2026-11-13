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
                                Ask any question: facts, maths, planning or projects
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
                            maxLength={2000}
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
                                    ? "Agents working (10-20s)..."
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
                            ["Router", "Classifies the question"],
                            ["Decomposer", "Breaks the problem into parts"],
                            ["Planner", "Builds a step-by-step plan"],
                            ["Solver", "Works through the plan and answers"],
                            ["Verifier", "Re-checks the answer; sends it back if wrong"],
                            ["Explainer", "Writes the final explanation"]
                        ].map(([agent, description], index) => (

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
                                        {description}
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


                    {result.answer && (
                        <div className="result-answer-highlight">
                            <span className="result-block-label">Answer</span>
                            <p>{result.answer}</p>
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

                            <p className="preserve-lines">
                                {result.solution}
                            </p>

                        </div>


                        <div className="result-panel-block">

                            <span className="result-block-label">
                                Verification
                            </span>

                            {result.verificationPassed != null && (
                                <div
                                    className={`verification-badge ${result.verificationPassed ? "is-passed" : "is-failed"}`}
                                >
                                    {result.verificationPassed ? "Verified" : "Not verified"}
                                    {result.confidence != null &&
                                        ` · ${Math.round(result.confidence * 100)}% confidence`}
                                    {result.revisions > 0 &&
                                        ` · ${result.revisions} revision${result.revisions > 1 ? "s" : ""}`}
                                </div>
                            )}

                            {result.verificationIssues?.length > 0 ? (
                                <ul>
                                    {result.verificationIssues.map((issue, index) => (
                                        <li key={index}>{issue}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>{result.verification}</p>
                            )}

                        </div>


                        <div className="result-panel-block">

                            <span className="result-block-label">
                                Explanation
                            </span>

                            <p className="preserve-lines">
                                {result.finalAnswer}
                            </p>

                        </div>

                    </div>

                    {result.trace?.length > 0 && (
                        <div className="agent-trace">
                            <span className="result-block-label">
                                Agent timeline
                                {result.totalMs ? ` · ${(result.totalMs / 1000).toFixed(1)}s total` : ""}
                                {result.tokens ? ` · ${result.tokens} tokens` : ""}
                            </span>
                            <div className="agent-trace-list">
                                {result.trace.map((t, index) => (
                                    <span key={index} className="agent-trace-chip">
                                        {t.agent} <small>{t.ms} ms</small>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                </section>

            )}

        </div>
    );
}

export default Reasoning;