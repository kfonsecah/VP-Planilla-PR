"use client";

import Image from "next/image";
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useLogin } from "@/hooks/useLogin";
import { useModal } from "@/hooks/useModal";

const LoginScreen = () => {
  const { showError, showSuccess, ModalComponent } = useModal();
  
  const {
    username,
    password,
    showPassword,
    isLoading,
    setUsername,
    setPassword,
    togglePasswordVisibility,
    handleSubmit,
  } = useLogin({ showError, showSuccess });

  return (
    <>
      <div className="flex min-h-screen font-inter">
        {/* Left Panel */}
        <div className="flex-none w-[40%] bg-[#FCF1D5] dark:bg-[#1a1a1a] flex flex-col p-10 shadow-lg relative z-10 rounded-l-lg">
          {/* Top-left aligned Logo and Title Section */}
          <div className="flex items-center self-start mb-auto">
            <Image
              src="/images/Logo.png"
              alt="Verde Pradera Cafetería Logo"
              width={100}
              height={100}
              className="mr-4 rounded-full"
            />
            <div className="flex flex-col">
              <h1 className="text-4xl font-semibold text-[#3B4D36] dark:text-white tracking-tight leading-none whitespace-nowrap">
                VERDE PRADERA
              </h1>
              <p className="text-xl text-[#D4BD80] dark:text-gray-400 mt-1 whitespace-nowrap">
                Control de planilla
              </p>
            </div>
          </div>

          <div className="flex-grow"></div>

          {/* Form Section */}
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm mx-auto mt-auto"
          >
            <div className="mb-6">
              <label
                htmlFor="username-input"
                className="block mb-2 text-xl font-medium text-gray-700 dark:text-gray-300"
              >
                Usuario
              </label>
              <input
                type="text"
                id="username-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 text-lg bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-600 rounded-md focus:ring-green-600 dark:focus:ring-green-500 focus:border-green-600 dark:focus:border-green-500 text-gray-900 dark:text-white"
                aria-label="Username"
                required
                disabled={isLoading}
              />
            </div>

            <div className="mb-8">
              <label
                htmlFor="password-input"
                className="block mb-2 text-xl font-medium text-gray-700 dark:text-gray-300"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 pr-12 text-lg bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-600 rounded-md focus:ring-green-600 dark:focus:ring-green-500 focus:border-green-600 dark:focus:border-green-500 text-gray-900 dark:text-white"
                  aria-label="Password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600 dark:text-gray-400"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-6 h-6" />
                  ) : (
                    <EyeIcon className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-md text-xl flex items-center justify-center gap-3 transition-colors duration-200 ${
                isLoading
                  ? "bg-gray-400 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed"
                  : "bg-[#3B4D36] dark:bg-[#4a6b4a] text-[#D4BD80] dark:text-gray-200 hover:bg-green-800 dark:hover:bg-[#3a5a3a] focus:ring-4 focus:ring-green-500 focus:ring-opacity-50"
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="w-6 h-6 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRightIcon className="w-6 h-6" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-[#344838] dark:bg-[#0a0f0a] relative overflow-hidden">
          <Image
            src="/images/LogInBackground.png"
            alt="Decorative Background Pattern"
            fill
            style={{ objectFit: "cover" }}
            className="opacity-50 mix-blend-multiply"
          />
        </div>
      </div>

      {/* Modal Component */}
      <ModalComponent />
    </>
  );
};

export default LoginScreen;
