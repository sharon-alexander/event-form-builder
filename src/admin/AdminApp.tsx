import {
  createHashRouter,
  createRoutesFromElements,
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  type DataRouter,
} from "react-router-dom";
import { isSupabaseConfigured } from "../lib/supabase";
import { AuthProvider } from "./auth";
import AuthEmailRedirect from "./components/AuthEmailRedirect";
import RequireAuth from "./components/RequireAuth";
import RequireSuperAdmin from "./components/RequireSuperAdmin";
import AdminLayout from "./components/AdminLayout";
import LoginPage from "./pages/LoginPage";
import SetPasswordPage from "./pages/SetPasswordPage";
import FormsListPage from "./pages/FormsListPage";
import FormEditorPage from "./pages/FormEditorPage";
import UsersPage from "./pages/UsersPage";
import { UnsavedGuardProvider } from "./unsavedGuard";

let adminRouter: DataRouter | null = null;

function getAdminRouter(): DataRouter {
  adminRouter ??= createHashRouter(
    createRoutesFromElements(
      <Route element={<AuthShell />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SetPasswordPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<FormsListPage />} />
          <Route path="/forms/:id" element={<FormEditorPage />} />
          <Route
            path="/users"
            element={
              <RequireSuperAdmin>
                <UsersPage />
              </RequireSuperAdmin>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>,
    ),
  );
  return adminRouter;
}

function AuthShell() {
  return (
    <UnsavedGuardProvider>
      <AuthEmailRedirect />
      <Outlet />
    </UnsavedGuardProvider>
  );
}

export default function AdminApp() {
  if (!isSupabaseConfigured) {
    return <NotConfigured />;
  }

  return (
    <AuthProvider>
      <RouterProvider router={getAdminRouter()} />
    </AuthProvider>
  );
}

function NotConfigured() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Supabase isn't configured
      </h1>
      <p className="mt-3 text-sm text-zinc-600">
        Set <code className="rounded bg-zinc-100 px-1">VITE_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-zinc-100 px-1">VITE_SUPABASE_ANON_KEY</code> in
        your environment, then rebuild. See <code>supabase/README.md</code>.
      </p>
    </div>
  );
}
