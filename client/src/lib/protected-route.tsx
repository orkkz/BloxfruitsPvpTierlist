import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, Redirect, useRoute, RouteProps } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

export function ProtectedRoute({
  path,
  component: Component
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [isActive] = useRoute(path);

  // Create a wrapper component that will be passed to Route
  const ProtectedComponent = (props: any) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      );
    }

    if (!user) {
      return <Redirect to="/auth" />;
    }

    return <Component {...props} />;
  };

  // Return the Route with our protected component
  return <Route path={path} component={ProtectedComponent} />;
}