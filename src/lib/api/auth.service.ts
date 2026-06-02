const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

// Helper to safely access localStorage
const storage = {
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value);
    }
  },
  getItem: (key: string): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key);
    }
    return null;
  },
  removeItem: (key: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  },
};

export interface LoginResponse {
  idUsuario: number;
  nombreUsuario: string;
  nombreCompleto: string;
  correo: string;
  rol: string;
  token: string;
}

export interface UsuarioResponse {
  idUsuario: number;
  nombreCompleto: string;
  correo: string;
  nombreUsuario: string;
  rol: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export const authService = {
  async login(correo: string, contrasena: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, contrasena }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al iniciar sesión");
    }

    const data = await response.json();
    storage.setItem("token", data.token);
    storage.setItem("user", JSON.stringify(data));
    return data;
  },

  async resetPassword(
    correo: string,
    contrasenaAnterior: string,
    contrasenanueva: string,
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, contrasenaAnterior, contrasenanueva }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al resetear contraseña");
    }
  },

  async createUsuario(
    nombreCompleto: string,
    correo: string,
    nombreUsuario: string,
    contrasena: string,
    idRol: number,
  ): Promise<UsuarioResponse> {
    const response = await fetch(`${API_BASE}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreCompleto, correo, nombreUsuario, contrasena, idRol }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al crear usuario");
    }

    return response.json();
  },

  async getUsuarios(): Promise<UsuarioResponse[]> {
    const response = await fetch(`${API_BASE}/usuarios`);

    if (!response.ok) {
      throw new Error("Error al obtener usuarios");
    }

    return response.json();
  },

  async getUsuario(id: number): Promise<UsuarioResponse> {
    const response = await fetch(`${API_BASE}/usuarios/${id}`);

    if (!response.ok) {
      throw new Error("Error al obtener usuario");
    }

    return response.json();
  },

  async updateUsuario(
    id: number,
    nombreCompleto: string,
    correo: string,
    nombreUsuario: string,
  ): Promise<UsuarioResponse> {
    const response = await fetch(`${API_BASE}/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreCompleto, correo, nombreUsuario }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al actualizar usuario");
    }

    return response.json();
  },

  async deleteUsuario(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/usuarios/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al eliminar usuario");
    }
  },

  getCurrentUser(): LoginResponse | null {
    const user = storage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  getToken(): string | null {
    return storage.getItem("token");
  },

  logout(): void {
    storage.removeItem("token");
    storage.removeItem("user");
  },

  isAuthenticated(): boolean {
    return !!storage.getItem("token");
  },
};
