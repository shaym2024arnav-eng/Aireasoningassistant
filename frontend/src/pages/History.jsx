import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

function History() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${API_BASE_URL}/api/reasoning/history`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setHistory(response.data.history || []);

            } catch (err) {
                console.error("History Error:", err);

                setError(
                    err.response?.data?.message ||
                    "Failed to load reasoning history."
                );

            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);


    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this reasoning session?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const token = localStorage.getItem("token");

            await axios.delete(
                `${API_BASE_URL}/api/reasoning/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setHistory((previousHistory) =>
                previousHistory.filter(
                    (item) => item._id !== id
                )
            );

        } catch (err) {
            console.error("Delete Error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to delete reasoning session."
            );
        }
    };


    return (
        <div className="enterprise-history-page">

            <div className="enterprise-page-header">

                <div>
                    <p className="enterprise-page-eyebrow">
                        REASONING HISTORY
                    </p>

                    <h1>
                        Previous reasoning sessions
                    </h1>

                    <p>
                        Review your past problems, generated plans,
                        source knowledge, and final reasoning outputs.
                    </p>
                </div>

                <div className="enterprise-status-chip">
                    {history.length} Sessions
                </div>

            </div>


            {loading && (
                <div className="enterprise-empty-state">
                    Loading reasoning history...
                </div>
            )}


            {!loading && error && (
                <div className="error-message">
                    {error}
                </div>
            )}


            {!loading &&
                !error &&
                history.length === 0 && (

                <div className="enterprise-empty-state">

                    <span>
                        No sessions yet
                    </span>

                    <h3>
                        Your reasoning history is empty
                    </h3>

                    <p>
                        Start a new reasoning session and
                        your saved analysis will appear here.
                    </p>

                </div>
            )}


            {!loading &&
                !error &&
                history.length > 0 && (

                <div className="enterprise-history-list">

                    {history.map((item, index) => (

                        <article
                            className="enterprise-history-card"
                            key={item._id}
                        >

                            <div className="history-card-top">

                                <div className="history-card-index">
                                    {String(index + 1).padStart(2, "0")}
                                </div>

                                <div className="history-card-main">

                                    <div className="history-title-row">

                                        <div>
                                            <h3>
                                                {item.problem}
                                            </h3>

                                            <span className="history-date">
                                                {item.createdAt
                                                    ? new Date(
                                                        item.createdAt
                                                    ).toLocaleString()
                                                    : "Date unavailable"
                                                }
                                            </span>
                                        </div>


                                        <div className="history-badges">

                                            {item.routeType && (
                                                <span className="history-type-badge">
                                                    {item.routeType}
                                                </span>
                                            )}

                                            {item.sourceTitle && (
                                                <span className="history-source-badge">
                                                    Wikipedia
                                                </span>
                                            )}

                                        </div>

                                    </div>


                                    {item.sourceTitle && (

                                        <div className="history-source-row">

                                            <span>
                                                Knowledge Source
                                            </span>

                                            <strong>
                                                {item.sourceTitle}
                                            </strong>

                                        </div>

                                    )}


                                    <div className="history-summary-grid">

                                        <div className="history-summary-block">

                                            <span>
                                                Breakdown
                                            </span>

                                            <strong>
                                                {item.breakdown?.length || 0}
                                            </strong>

                                            <small>
                                                reasoning points
                                            </small>

                                        </div>


                                        <div className="history-summary-block">

                                            <span>
                                                Plan
                                            </span>

                                            <strong>
                                                {item.plan?.length || 0}
                                            </strong>

                                            <small>
                                                structured steps
                                            </small>

                                        </div>


                                        <div className="history-summary-block">

                                            <span>
                                                Status
                                            </span>

                                            <strong className="completed-text">
                                                {item.verificationPassed === true
                                                    ? "Verified"
                                                    : item.verificationPassed === false
                                                        ? "Not verified"
                                                        : "Completed"}
                                            </strong>

                                            <small>
                                                {item.confidence != null
                                                    ? `${Math.round(item.confidence * 100)}% confidence`
                                                    : "analysis generated"}
                                            </small>

                                        </div>

                                    </div>


                                    <details className="history-details">

                                        <summary>
                                            View full analysis
                                        </summary>


                                        {item.answer && (

                                            <div className="history-detail-block">

                                                <h4>
                                                    Answer
                                                </h4>

                                                <p>
                                                    <strong>{item.answer}</strong>
                                                </p>

                                            </div>

                                        )}


                                        {item.breakdown?.length > 0 && (

                                            <div className="history-detail-block">

                                                <h4>
                                                    Problem Breakdown
                                                </h4>

                                                <ol>

                                                    {item.breakdown.map(
                                                        (step, stepIndex) => (

                                                            <li key={stepIndex}>
                                                                {step}
                                                            </li>

                                                        )
                                                    )}

                                                </ol>

                                            </div>

                                        )}


                                        {item.plan?.length > 0 && (

                                            <div className="history-detail-block">

                                                <h4>
                                                    Reasoning Plan
                                                </h4>

                                                <ol>

                                                    {item.plan.map(
                                                        (step, stepIndex) => (

                                                            <li key={stepIndex}>
                                                                {step}
                                                            </li>

                                                        )
                                                    )}

                                                </ol>

                                            </div>

                                        )}


                                        {item.solution && (

                                            <div className="history-detail-block">

                                                <h4>
                                                    Solution
                                                </h4>

                                                <p className="preserve-lines">
                                                    {item.solution}
                                                </p>

                                            </div>

                                        )}


                                        {item.verification && (

                                            <div className="history-detail-block">

                                                <h4>
                                                    Verification
                                                </h4>

                                                <p>
                                                    {item.verification}
                                                </p>

                                            </div>

                                        )}


                                        {item.finalAnswer && (

                                            <div className="history-detail-block">

                                                <h4>
                                                    {item.answer ? "Explanation" : "Final Answer"}
                                                </h4>

                                                <p className="preserve-lines">
                                                    {item.finalAnswer}
                                                </p>

                                            </div>

                                        )}

                                    </details>


                                    <div className="history-card-actions">

                                        <button
                                            className="history-delete-btn"
                                            onClick={() =>
                                                handleDelete(item._id)
                                            }
                                        >
                                            Delete Session
                                        </button>

                                    </div>

                                </div>

                            </div>

                        </article>

                    ))}

                </div>
            )}

        </div>
    );
}

export default History;