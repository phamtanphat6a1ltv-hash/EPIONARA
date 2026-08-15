import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext.jsx';

/**
 * Zero Trust: Default Deny & Conditional Access Control
 * Wraps routes that require authentication and specific authorization.
 */
export function ProtectedRoute({ children, requiredPlan }) {
  const { user, isInitializing, setAuthModal } = useAppContext();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "white" }}>
        <div style={{ width: 30, height: 30, border: "3px solid rgba(167,139,250,0.3)", borderTop: "3px solid #a78bfa", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  // 1. Default Deny: Block unauthenticated access immediately
  if (!user) {
    // Trigger auth modal so the user knows they must log in
    setTimeout(() => {
      if (typeof setAuthModal === 'function') setAuthModal(true);
    }, 100);
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 2. Conditional Access Control: Enforce subscription tiers / roles
  if (requiredPlan === 'PREMIUM') {
    if (!user.plan_type || user.plan_type === 'FREE') {
      // Redirect to a dashboard or a pricing page with state
      return <Navigate to="/" state={{ upgradeRequired: true, feature: location.pathname }} replace />;
    }
  }

  return children;
}
