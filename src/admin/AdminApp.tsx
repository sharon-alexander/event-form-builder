import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { isSupabaseConfigured } from "../lib/supabase";
import { AuthProvider } from "./auth";
import RequireAuth from "./components/RequireAuth";
import AdminLayout from "./components/AdminLayout";
import LoginPage from "./pages/LoginPage";
import FormsListPage from "./pages/FormsListPage";
import FormEditorPage from "./pages/FormEditorPage";

export default function AdminApp() {
  if (!isSupabaseConfigured) {
    return <NotConfigured />;
  }

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<FormsListPage />} />
            <Route path="/forms/:id" element={<FormEditorPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

function NotConfigured() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-semibold text-gray-900">
        Supabase isn't configured
      </h1>
      <p className="mt-3 text-sm text-gray-600">
        Set <code className="rounded bg-gray-100 px-1">VITE_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-gray-100 px-1">VITE_SUPABASE_ANON_KEY</code> in
        your environment, then rebuild. See <code>supabase/README.md</code>.
      </p>
    </div>
  );
}
