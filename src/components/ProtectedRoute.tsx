import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AdminAuthLayout } from "@/components/auth/AdminAuthLayout";
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading)
    return (
      <AdminAuthLayout
        title="Checking administrator access"
        description="Please wait while your session and permissions are verified."
      >
        <p role="status">Checking access…</p>
      </AdminAuthLayout>
    );
  if (auth.status === "error")
    return (
      <AdminAuthLayout
        title="Access check unavailable"
        description="Your dashboard stays protected while access cannot be verified."
      >
        <p role="alert">{auth.error}</p>
        <Button className="mt-4" onClick={() => void auth.retry()}>
          Retry access check
        </Button>
      </AdminAuthLayout>
    );
  if (auth.status === "mfa_required")
    return <Navigate to="/login/verify" replace />;
  if (auth.status === "recovery")
    return <Navigate to="/reset-password" replace />;
  if (!auth.isAdmin)
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  return <>{children}</>;
}
