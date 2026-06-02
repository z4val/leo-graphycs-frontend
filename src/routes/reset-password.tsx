import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authService } from "@/lib/api/auth.service";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Resetear contraseña — PREX ERP" },
      { name: "description", content: "Recupera acceso a tu cuenta." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [contrasenaAnterior, setContrasenaAnterior] = useState("");
  const [contrasenanueva, setContrasenanueva] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await authService.resetPassword(correo, contrasenaAnterior, contrasenanueva);
      setSuccess("Contraseña actualizada correctamente. Redirigiendo...");
      setTimeout(() => navigate({ to: "/login" }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al resetear contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-paper text-ink">
      {/* Left: focal panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-ink text-paper overflow-hidden">
        <div className="absolute bottom-[-15%] right-[-10%] size-[28rem] bg-cyan-press/20 blur-[120px] rounded-full" />
        <div className="absolute top-[-15%] right-[20%] size-[24rem] bg-magenta-press/15 blur-[120px] rounded-full" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="size-9 bg-paper rounded flex items-center justify-center text-ink font-display font-bold text-xs tracking-tighter">
            PX
          </div>
          <span className="font-display font-bold tracking-tight text-lg">PREX ERP</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-cyan-press" />
            <span className="size-2.5 rounded-full bg-magenta-press" />
            <span className="size-2.5 rounded-full bg-yellow-press" />
            <span className="size-2.5 rounded-full bg-paper" />
          </div>
          <h2 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance">
            Recupera tu acceso.
          </h2>
          <p className="text-paper/60 text-sm leading-relaxed max-w-sm">
            Ingresa tu correo y contraseña anterior para crear una nueva contraseña.
          </p>
        </div>

        <div className="relative z-10 flex items-end justify-between text-[10px] font-mono uppercase tracking-widest text-paper/40">
          <span>v1.0 · Edición Taller</span>
          <span>CMYK · 2026</span>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-ink/40">
              Recuperación de cuenta
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Resetear contraseña
            </h1>
            <p className="text-sm text-ink/60">
              Ingresa tus datos para crear una nueva contraseña.
            </p>
          </div>

          <div className="space-y-4">
            <Field
              label="Correo electrónico"
              type="email"
              value={correo}
              onChange={setCorreo}
            />
            <Field
              label="Contraseña anterior"
              type="password"
              value={contrasenaAnterior}
              onChange={setContrasenaAnterior}
            />
            <Field
              label="Nueva contraseña"
              type="password"
              value={contrasenanueva}
              onChange={setContrasenanueva}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-press/10 border border-emerald-press/20 p-3 rounded text-sm text-emerald-press">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-paper font-medium text-sm py-3 rounded-md hover:bg-ink/90 transition-colors uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Procesando..." : "Actualizar contraseña"}
          </button>

          <div className="text-center text-sm">
            <Link to="/login" className="text-ink/60 hover:text-ink underline-offset-4 hover:underline">
              Volver a iniciar sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-mono uppercase tracking-widest text-ink/40">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-white border border-ink/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-press/40 focus:border-cyan-press transition"
      />
    </label>
  );
}
