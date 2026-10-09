import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";

import AppLayout from "./layouts/AppLayout";
import Overview from "./pages/app/Overview";
import TransactionsPage from "./pages/app/TransactionsPage";
import ReviewInbox from "./pages/app/ReviewInbox";
import Analytics from "./pages/app/Analytics";
import Budgets from "./pages/app/Budgets";
import Devices from "./pages/app/Devices";

function App() {
  useEffect(() => {
    AOS.init({
      duration: 900,
      once: true,
      easing: "ease-out-cubic",
    });
  }, []);

  return (
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
    </Routes>
  );
}

export default App;