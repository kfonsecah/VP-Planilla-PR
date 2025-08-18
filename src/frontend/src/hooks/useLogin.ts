"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/user";
import { useModal } from "@/hooks/useModal";

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

interface LoginResponse {
  success: boolean;
  user?: AuthenticatedUser;
  token?: string;
  message?: string;
  type?: string;
}

export const useLogin = (modalActions?: { showError: (title: string, message: string, onConfirm?: () => void) => void; showSuccess: (title: string, message: string, onConfirm?: () => void) => void }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { setUser } = useUser();
  
  // Usar las funciones de modal pasadas como parámetro, o crear instancia local como fallback
  const fallbackModal = useModal();
  const showError = modalActions?.showError || fallbackModal.showError;
  const showSuccess = modalActions?.showSuccess || fallbackModal.showSuccess;

  const validateCredentials = (username: string, password: string): boolean => {
    if (!username.trim() || !password.trim()) {
      showError(
        "¡Ups! Faltan datos",
        "Por favor completa tanto tu usuario como tu contraseña para poder ingresar."
      );
      return false;
    }
    return true;
  };

  const handleApiError = (data: LoginResponse, response: Response): void => {
    let errorTitle = "No pudimos conectarte";
    let errorMessage = "Verifica tus datos e intenta nuevamente.";

    if (data.type === "user_not_found") {
      errorTitle = "Usuario no encontrado";
      errorMessage =
        "El usuario que ingresaste no existe en nuestro sistema. ¿Estás seguro de que escribiste bien tu nombre de usuario?";
    } else if (data.type === "invalid_password") {
      errorTitle = "Contraseña incorrecta";
      errorMessage =
        "La contraseña que ingresaste no es correcta. Por favor verifica e intenta nuevamente.";
    } else if (data.type === "invalid_credentials") {
      errorTitle = "Datos incorrectos";
      errorMessage =
        "El usuario o la contraseña que ingresaste no son correctos. Por favor revisa tus datos.";
    } else if (data.type === "validation_error") {
      errorTitle = "Datos incompletos";
      errorMessage =
        data.message ||
        "Por favor completa todos los campos requeridos.";
    } else if (response.status === 401) {
      errorTitle = "Acceso denegado";
      errorMessage =
        "Los datos que ingresaste no coinciden con nuestros registros. ¿Necesitas ayuda para recuperar tu acceso?";
    } else if (response.status >= 500) {
      errorTitle = "Problema del servidor";
      errorMessage =
        "Tenemos un problema técnico en este momento. Por favor intenta nuevamente en unos minutos.";
    } else {
      errorMessage =
        data.message ||
        "Ha ocurrido un problema inesperado. Por favor intenta nuevamente.";
    }

    showError(errorTitle, errorMessage);
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

  const handleSuccessfulLogin = (data: LoginResponse): void => {
    if (data.user && data.token) {
      // Guardar datos en localStorage
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Actualizar estado global
      setUser(data.user);

      // Guardar referencia del usuario para usar en el timeout
      const user = data.user;

      // Dar tiempo para que el estado se propague antes de mostrar el modal
      setTimeout(() => {
        // Mostrar mensaje de éxito con callback de redirección
        showSuccess(
          "¡Bienvenido de vuelta!",
          `Hola ${user.first_name}, nos alegra verte de nuevo.`,
          () => {
            router.push("/pages/main");
          }
        );
      }, 100);
    }
  };

  const performLogin = async (credentials: LoginCredentials): Promise<void> => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      showError(
        "Error de configuración",
        "Hay un problema con la configuración del sistema. Por favor contacta al administrador."
      );
      return;
    }

    const loginUrl = `${apiUrl}/login`;

    const response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data: LoginResponse = await response.json();

    console.log("Respuesta completa de la API:", data);

    if (data.success && data.user && data.token) {
      handleSuccessfulLogin(data);
    } else {
      handleApiError(data, response);
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
    
    // Funciones de estado
    setUsername,
    setPassword,
    togglePasswordVisibility,
    resetForm,
    
    // Función principal
    handleSubmit,
  };
};
