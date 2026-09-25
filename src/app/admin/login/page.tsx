import { Suspense } from "react";
import AdminLoginForm from "./login-form";

// useSearchParams() (for callbackUrl) requires a Suspense boundary to be
// statically prerenderable — split into a server wrapper + client form.
export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
