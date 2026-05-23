"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/user";
import { useModal } from "@/hooks/useModal";
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Interfaces para tipado
interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthenticatedUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  role: string;
}

export const useLogin = (modalActions?: { showError: (title: string, message: string, onConfirm?: () => void) => void; showSuccess: (title: string, message: string, onConfirm?: () => void) => void }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { setUser } = useUser();
  const { login } = useAuth();
  
  // Usar las funciones de modal pasadas como parámetro, o crear instancia local como fallback
  const fallbackModal = useModal();
  const showError = modalActions?.showError || fallbackModal.showError;
  const validateCredentials = (username: string, password: string): boolean => {
    if (!username.trim() || !password.trim()) {
      setError("Por favor completa tanto tu usuario como tu contraseña.");
      return false;
    }
    return true;
  };

  const handleNetworkError = (error: unknown): void => {
    console.error("Error en la llamada a la API:", error);

    if (error instanceof TypeError && error.message.includes("fetch")) {
      showError(
        "Sin conexión",
        "No podemos conectarnos al servidor en este momento. Por favor verifica tu conexión a internet e intenta nuevamente."
      );
    } else {
      showError(
        "Error inesperado",
        "Ha ocurrido un problema técnico. Si el problema persiste, por favor contacta al administrador del sistema."
      );
    }
  };

  const handleSuccessfulLogin = (userData: AuthenticatedUser): void => {
    if (userData) {
      // Guardar datos en localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Actualizar estado global
      setUser(userData);

      // Toast de bienvenida y redirección inmediata
      toast.success(`¡Bienvenido de vuelta, ${userData.first_name}!`, {
        description: "Has iniciado sesión correctamente.",
        duration: 4000,
      });
      
      router.push("/pages/main");
    }
  };

  const performLogin = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setError(null);
      await login(credentials.username, credentials.password);

      // after login, current user is stored in localStorage by AuthProvider; read it
      const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (stored) {
        try {
          handleSuccessfulLogin(JSON.parse(stored));
          return;
        } catch {}
      }

      // fallback: show success without user
      toast.success('Inicio exitoso');
      router.push('/pages/main');
    } catch (error: unknown) {
      if (error instanceof Error && error.message) {
        // En lugar de modal, usamos el estado de error local para credenciales incorrectas
        setError(error.message);
      } else {
        handleNetworkError(error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar credenciales
      if (!validateCredentials(username, password)) {
        setIsLoading(false);
        return;
      }

      // Preparar credenciales
      const credentials: LoginCredentials = {
        username: username.trim(),
        password: password.trim(),
      };

      // Realizar login
      await performLogin(credentials);

    } catch (error) {
      handleNetworkError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  };

  const resetForm = (): void => {
    setUsername("");
    setPassword("");
    setShowPassword(false);
  };

  return {
    // Estados
    username,
    password,
    showPassword,
    isLoading,
    error,
    
    // Funciones de estado
    setUsername: (val: string) => { setUsername(val); setError(null); },
    setPassword: (val: string) => { setPassword(val); setError(null); },
    togglePasswordVisibility,
    resetForm,
    
    // Función principal
    handleSubmit,
  };
};
