"use client";

import Image from "next/image";
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  LockClosedIcon,
  UserIcon,
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
      <div className="flex min-h-screen bg-[#FCF1D5] dark:bg-zinc-950 relative overflow-hidden">
        {/* Background leaf image - full screen, very subtle */}
        <Image
          src="/images/LogInBackground.png"
          alt=""
          fill
          style={{ objectFit: "cover" }}
          className="opacity-22 mix-blend-overlay pointer-events-none"
          priority
          quality={40}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-6 py-12">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-10">
            <Image
              src="/images/Logo.png"
              alt="Verde Gestión Logo"
              width={52}
              height={52}
              className="rounded-full shadow-md"
              priority
              quality={80}
            />
            <div>
              <h1 className="text-2xl font-bold text-[#3B4D36] dark:text-zinc-100 tracking-tight" style={{ fontFamily: 'VerdeFont, Inter, sans-serif' }}>
                VERDE GESTIÓN
              </h1>
              <p className="text-sm text-[#8B7D5E] dark:text-zinc-400">Sistema de Planilla</p>
            </div>
          </div>

          {/* Login card */}
          <div className="w-full max-w-md bg-white/80 dark:bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-[#D4C89A]/50 dark:border-zinc-800 p-8 shadow-xl shadow-[#3B4D36]/5 dark:shadow-black/20">
            <div className="mb-7">
              <h2 className="text-xl font-semibold text-[#3B4D36] dark:text-zinc-100">
                Iniciar sesión
              </h2>
              <p className="text-sm text-[#8B7D5E] dark:text-zinc-400 mt-1">
                Ingresá tus credenciales para acceder al sistema
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label htmlFor="username-input" className="block text-sm font-medium text-[#4A5D3A] dark:text-zinc-300 mb-1.5">
                  Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <UserIcon className="w-4 h-4 text-[#8B7D5E] dark:text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    id="username-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Tu nombre de usuario"
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-800 border border-[#D4C89A] dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153] dark:focus:ring-green-500 focus:border-transparent text-zinc-800 dark:text-zinc-100 text-sm placeholder-[#B8A989] dark:placeholder-zinc-500 transition-all"
                    aria-label="Username"
                    required
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password-input" className="block text-sm font-medium text-[#4A5D3A] dark:text-zinc-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <LockClosedIcon className="w-4 h-4 text-[#8B7D5E] dark:text-zinc-500" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    className="w-full pl-10 pr-12 py-3 bg-white dark:bg-zinc-800 border border-[#D4C89A] dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153] dark:focus:ring-green-500 focus:border-transparent text-zinc-800 dark:text-zinc-100 text-sm placeholder-[#B8A989] dark:placeholder-zinc-500 transition-all"
                    aria-label="Password"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#8B7D5E] dark:text-zinc-400 hover:text-[#4A5D3A] dark:hover:text-zinc-300 transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#3B4D36] hover:bg-[#2D3A28] dark:bg-green-600 dark:hover:bg-green-500 disabled:bg-zinc-400 dark:disabled:bg-zinc-600 text-[#D4BD80] dark:text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-[#3B4D36]/20 dark:shadow-green-600/20"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    Ingresar
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-xs text-[#8B7D5E] dark:text-zinc-500 mt-8">
            © {new Date().getFullYear()} Verde Gestión — Control de planilla
          </p>
        </div>
      </div>

      <ModalComponent />
    </>
  );
};

export default LoginScreen;
