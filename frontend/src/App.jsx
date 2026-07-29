import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Reasoning from "./pages/Reasoning";
import History from "./pages/History";
import Agents from "./pages/Agents";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

function ProtectedPage({ children }) {
    return (
        <ProtectedRoute>
            <AppLayout>
                {children}
            </AppLayout>
        </ProtectedRoute>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedPage>
                            <Dashboard />
                        </ProtectedPage>
                    }
                />

                <Route
                    path="/reasoning"
                    element={
                        <ProtectedPage>
                            <Reasoning />
                        </ProtectedPage>
                    }
                />

                <Route
                    path="/history"
                    element={
                        <ProtectedPage>
                            <History />
                        </ProtectedPage>
                    }
                />

                <Route
                    path="/agents"
                    element={
                        <ProtectedPage>
                            <Agents />
                        </ProtectedPage>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;