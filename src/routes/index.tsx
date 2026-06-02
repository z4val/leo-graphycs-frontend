import { createFileRoute, redirect } from "@tanstack/react-router";
import { authService } from "@/lib/api/auth.service";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const isAuthenticated = authService.isAuthenticated();
    if (isAuthenticated) {
      throw redirect({ to: "/dashboard" });
    } else {
      throw redirect({ to: "/login" });
    }
  },
});
