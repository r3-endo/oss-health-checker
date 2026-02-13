import { useEffect, useState } from "react";
import { DashboardPage } from "../features/dashboard";
import { RepositoriesPage } from "../features/repositories";
import { RegistryAdoptionPage } from "../features/registry-adoption";

const normalizePath = (path: string): string => {
  if (!path || path === "") return "/";
  return path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
};

export const resolveRoute = (
  rawPath: string,
): "dashboard" | "github" | "registry" | "not_found" => {
  const path = normalizePath(rawPath);
  if (path === "/") return "dashboard";
  if (path === "/github") return "github";
  if (path === "/registry") return "registry";
  return "not_found";
};

export const AppRouter = () => {
  const [path, setPath] = useState<string>(
    normalizePath(window.location.pathname),
  );

  useEffect(() => {
    const onPopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const route = resolveRoute(path);

  if (route === "dashboard") {
    return <DashboardPage />;
  }

  if (route === "github") {
    return <RepositoriesPage />;
  }

  if (route === "registry") {
    return <RegistryAdoptionPage />;
  }

  return (
    <main className="min-h-screen px-6 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">Page not found</h1>
        <p className="text-sm text-text-secondary">
          Use dashboard links to continue.
        </p>
        <a href="/" className="text-sm text-text-secondary hover:underline">
          Back to Dashboard
        </a>
      </div>
    </main>
  );
};
