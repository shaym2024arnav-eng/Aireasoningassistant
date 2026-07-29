const agents = [
    {
        name: "Router Agent",
        role: "Question Classification",
        description:
            "Analyzes the user's question and decides whether it should use factual knowledge retrieval or structured reasoning logic."
    },
    {
        name: "Decomposer Agent",
        role: "Problem Breakdown",
        description:
            "Breaks a complex problem into smaller, manageable parts so the system can reason through each component clearly."
    },
    {
        name: "Planner Agent",
        role: "Strategy Building",
        description:
            "Creates a structured step-by-step plan based on the problem breakdown and available knowledge."
    },
    {
        name: "Solver Agent",
        role: "Solution Generation",
        description:
            "Uses the reasoning plan and retrieved context to generate a detailed and practical solution."
    },
    {
        name: "Verifier Agent",
        role: "Quality Check",
        description:
            "Reviews the generated solution for completeness, logical consistency, and relevance to the original problem."
    },
    {
        name: "Explainer Agent",
        role: "Final Explanation",
        description:
            "Combines the reasoning process into a clear, structured, and understandable final response."
    }
];

function Agents() {
    return (
        <div className="enterprise-agents-page">

            <div className="enterprise-page-header">

                <div>
                    <p className="enterprise-page-eyebrow">
                        MULTI-AGENT ARCHITECTURE
                    </p>

                    <h1>
                        Reasoning agent workflow
                    </h1>

                    <p>
                        Explore how specialized agents collaborate to classify,
                        analyze, solve, verify, and explain every reasoning request.
                    </p>
                </div>

                <div className="enterprise-status-chip">
                    6 Agents Operational
                </div>

            </div>


            <section className="agent-pipeline-panel">

                <div className="enterprise-panel-header">

                    <div>
                        <h3>
                            Agent Pipeline
                        </h3>

                        <span>
                            End-to-end reasoning workflow
                        </span>
                    </div>

                </div>


                <div className="agent-pipeline">

                    {agents.map((agent, index) => (

                        <div
                            className="agent-pipeline-step"
                            key={agent.name}
                        >

                            <div className="agent-step-number">
                                {String(index + 1).padStart(2, "0")}
                            </div>

                            <div className="agent-step-content">

                                <span className="agent-role">
                                    {agent.role}
                                </span>

                                <h3>
                                    {agent.name}
                                </h3>

                                <p>
                                    {agent.description}
                                </p>

                                <div className="agent-status-row">

                                    <span className="agent-live-dot"></span>

                                    <span>
                                        Operational
                                    </span>

                                </div>

                            </div>


                            {index < agents.length - 1 && (

                                <div className="agent-connector">
                                    ↓
                                </div>

                            )}

                        </div>

                    ))}

                </div>

            </section>


            <section className="agent-overview-grid">

                <div className="agent-overview-card">

                    <span>
                        Total Agents
                    </span>

                    <strong>
                        6
                    </strong>

                    <p>
                        Specialized agents working together
                        inside the reasoning pipeline.
                    </p>

                </div>


                <div className="agent-overview-card">

                    <span>
                        Knowledge Routing
                    </span>

                    <strong>
                        Hybrid
                    </strong>

                    <p>
                        Factual questions use Wikipedia while
                        planning questions use reasoning logic.
                    </p>

                </div>


                <div className="agent-overview-card">

                    <span>
                        Pipeline Status
                    </span>

                    <strong className="agent-green-text">
                        Online
                    </strong>

                    <p>
                        All reasoning components are currently
                        available and operational.
                    </p>

                </div>

            </section>

        </div>
    );
}

export default Agents;