import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";

// The landing page loads first; everything else is fetched only when it is visited,
// so a first-time visitor never downloads the dashboard, charts or socket client.
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AppLayout = lazy(() => import("./layouts/AppLayout"));
const Overview = lazy(() => import("./pages/app/Overview"));
const TransactionsPage = lazy(() => import("./pages/app/TransactionsPage"));
const ReviewInbox = lazy(() => import("./pages/app/ReviewInbox"));
const Analytics = lazy(() => import("./pages/app/Analytics"));
const Budgets = lazy(() => import("./pages/app/Budgets"));
const Devices = lazy(() => import("./pages/app/Devices"));

// Inline styles on purpose: this shows before any page stylesheet has arrived
const fallback = (
  <div
    role="status"
    aria-live="polite"
    style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#090c09", color: "#98a496", font: "14px 'IBM Plex Sans', system-ui, sans-serif" }}
  >
    Loading…
  </div>
);

function App() {
  return (
    <Suspense fallback={fallback}>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        {/* The signed-in app: one layout (sidebar + top bar) with a page per section */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="review" element={<ReviewInbox />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="budgets" element={<Budgets />} />
          <Route path="devices" element={<Devices />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;