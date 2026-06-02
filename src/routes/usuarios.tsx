import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { accentBar, accentBg20, accentRing30 } from "@/components/accent-classes";
import { authService, type UsuarioResponse } from "@/lib/api/auth.service";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/usuarios")({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Usuarios — PREX ERP" },
      { name: "description", content: "Gestión de usuarios, roles y permisos del taller." },
    ],
  }),
  component: UsuariosPage,
});

const roleAccent: Record<string, string> = {
  "Administrador": "magenta-press",
  "Operador": "cyan-press",
  "Diseñador": "yellow-press",
  "Vendedor": "emerald-press",
};

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioResponse | null>(null);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      const data = await authService.getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const canCreateUsuarios = currentUser?.rol === "Administrador";

  return (
    <AppShell
      title="Gestión de Usuarios"
      action={
        canCreateUsuarios && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-1.5 bg-ink text-paper rounded text-[11px] font-semibold uppercase tracking-widest hover:bg-ink/90 transition-all"
          >
            + Invitar usuario
          </button>
        )
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Stat label="Total usuarios" value={usuarios.length.toString()} accent="cyan-press" />
        <Stat label="Activos" value={usuarios.filter(u => u.activo).length.toString()} accent="emerald-press" />
        <Stat label="Administradores" value={usuarios.filter(u => u.rol === "Administrador").length.toString()} accent="magenta-press" />
        <Stat label="Operadores" value={usuarios.filter(u => u.rol === "Operador").length.toString()} accent="yellow-press" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Users grid */}
        <div className="col-span-8 grid grid-cols-2 gap-4">
          {usuarios.map((u) => (
            <div
              key={u.idUsuario}
              onClick={() => setSelectedUsuario(u)}
              className="bg-white border border-ink/5 rounded-xl p-5 hover:border-ink/20 transition-colors group relative overflow-hidden cursor-pointer"
            >
              <div className={`absolute top-0 left-0 h-0.5 w-16 ${accentBar[roleAccent[u.rol]]}`} />
              <div className="flex items-start gap-4">
                <div className={`size-12 rounded-full ${accentBg20[roleAccent[u.rol]]} ring-1 ${accentRing30[roleAccent[u.rol]]} grid place-items-center shrink-0`}>
                  <span className="font-display font-bold text-sm">
                    {u.nombreCompleto.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-bold text-sm truncate">{u.nombreCompleto}</h3>
                    <span className={`size-2 rounded-full shrink-0 ${u.activo ? "bg-emerald-press" : "bg-ink/20"}`} />
                  </div>
                  <p className="text-xs text-ink/50 truncate">{u.correo}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-tighter bg-ink/5 text-ink/70">
                      {u.rol}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <aside className="col-span-4 bg-white border border-ink/5 rounded-2xl p-6 flex flex-col">
          {selectedUsuario ? (
            <UsuarioDetail usuario={selectedUsuario} onUpdate={loadUsuarios} currentUser={currentUser} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-ink/40">Selecciona un usuario para ver detalles</p>
            </div>
          )}
        </aside>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateUsuarioModal onClose={() => setShowCreateForm(false)} onCreated={loadUsuarios} />
      )}
    </AppShell>
  );
}

function UsuarioDetail({ usuario, onUpdate, currentUser }: { usuario: UsuarioResponse; onUpdate: () => void; currentUser: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nombreCompleto: usuario.nombreCompleto,
    correo: usuario.correo,
    nombreUsuario: usuario.nombreUsuario,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      await authService.updateUsuario(usuario.idUsuario, editData.nombreCompleto, editData.correo, editData.nombreUsuario);
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  const canEdit = currentUser?.idUsuario === usuario.idUsuario || currentUser?.rol === "Administrador";
  const canDelete = currentUser?.rol === "Administrador" && currentUser?.idUsuario !== usuario.idUsuario;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-lg mb-4">{usuario.nombreCompleto}</h2>
        <div className="space-y-3">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editData.nombreCompleto}
                onChange={(e) => setEditData({ ...editData, nombreCompleto: e.target.value })}
                className="w-full px-3 py-2 border border-ink/10 rounded text-sm"
              />
              <input
                type="email"
                value={editData.correo}
                onChange={(e) => setEditData({ ...editData, correo: e.target.value })}
                className="w-full px-3 py-2 border border-ink/10 rounded text-sm"
              />
              <input
                type="text"
                value={editData.nombreUsuario}
                onChange={(e) => setEditData({ ...editData, nombreUsuario: e.target.value })}
                className="w-full px-3 py-2 border border-ink/10 rounded text-sm"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 px-3 py-2 bg-cyan-press text-white rounded text-sm font-semibold disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-3 py-2 border border-ink/10 rounded text-sm font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-[10px] font-mono text-ink/40 mb-1">Nombre</p>
                <p className="font-semibold">{usuario.nombreCompleto}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-ink/40 mb-1">Usuario</p>
                <p className="font-semibold">{usuario.nombreUsuario}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-ink/40 mb-1">Correo</p>
                <p className="font-semibold text-sm">{usuario.correo}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-ink/40 mb-1">Rol</p>
                <p className="font-semibold">{usuario.rol}</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full px-3 py-2 border border-cyan-press text-cyan-press rounded text-sm font-semibold hover:bg-cyan-press/5 transition"
                >
                  Editar datos
                </button>
              )}
              {canDelete && (
                <button
                  className="w-full px-3 py-2 border border-destructive text-destructive rounded text-sm font-semibold hover:bg-destructive/5 transition"
                >
                  Eliminar usuario
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateUsuarioModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [formData, setFormData] = useState({
    nombreCompleto: "",
    correo: "",
    nombreUsuario: "",
    contrasena: "",
    idRol: 2, // Operador por defecto
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authService.createUsuario(
        formData.nombreCompleto,
        formData.correo,
        formData.nombreUsuario,
        formData.contrasena,
        formData.idRol
      );
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <h2 className="font-display font-bold text-lg mb-6">Crear nuevo usuario</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nombre completo"
            value={formData.nombreCompleto}
            onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
            className="w-full px-3 py-2 border border-ink/10 rounded text-sm"
            required
          />
          <input
            type="email"
            placeholder="Correo"
            value={formData.correo}
            onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
            className="w-full px-3 py-2 border border-ink/10 rounded text-sm"
            required
          />
          <input
            type="text"
            placeholder="Usuario"
            value={formData.nombreUsuario}
            onChange={(e) => setFormData({ ...formData, nombreUsuario: e.target.value })}
            className="w-full px-3 py-2 border border-ink/10 rounded text-sm"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={formData.contrasena}
            onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
            className="w-full px-3 py-2 border border-ink/10 rounded text-sm"
            required
          />
          <select
            value={formData.idRol}
            onChange={(e) => setFormData({ ...formData, idRol: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-ink/10 rounded text-sm"
          >
            <option value="1">Administrador</option>
            <option value="2">Operador</option>
            <option value="3">Diseñador</option>
            <option value="4">Vendedor</option>
          </select>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-ink text-paper rounded font-semibold disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear usuario"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-ink/10 rounded font-semibold"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-white border border-ink/5 rounded-lg p-4">
      <p className="text-[10px] font-mono text-ink/40 mb-2 uppercase tracking-widest">{label}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
