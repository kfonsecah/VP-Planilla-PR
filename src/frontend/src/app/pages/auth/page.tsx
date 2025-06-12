"use client";

import { useState } from "react";
import Image from "next/image";
// Import icons for password toggle and button
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/user";

const LoginScreen = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();
  const {setUser} = useUser(); // Assuming you have a custom hook to manage user state
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Usuario:", username);
    console.log("Contraseña:", password);
    setUser(username); // Update user state
    router.push("/pages/main");
  };

  return (
    <div className="flex min-h-screen font-inter">
      {/* Left Panel */}
      {/* The left panel maintains its white background and shadow */}
      <div className="flex-none w-[40%] bg-[#FCF1D5] flex flex-col p-10 shadow-lg relative z-10 rounded-l-lg">
        {/* Top-left aligned Logo and Title Section */}
        <div className="flex items-center self-start mb-auto">
          {/* Logo */}
          <Image
            src="/images/Logo.png" // Ensure this path is correct for your logo
            alt="Verde Pradera Cafetería Logo"
            width={100} // Adjust size as per screenshot
            height={100} // Adjust size as per screenshot
            className="mr-4 rounded-full" // Added rounded-full and margin-right for spacing
          />
          <div className="flex flex-col">
            {/* Main title for "Verde Pradera" */}
            <h1 className="text-4xl font-semibold text-[#3B4D36] tracking-tight leading-none whitespace-nowrap">
              VERDE PRADERA
            </h1>
            {/* Subtitle for "Control de planilla" */}
            <p className="text-xl text-[#D4BD80] mt-1 whitespace-nowrap">
              Control de planilla
            </p>
          </div>
        </div>

        {/* This div acts as a flexible spacer to push the form down */}
        <div className="flex-grow"></div>

        {/* Form Section - Centered at the bottom */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm mx-auto mt-auto"
        >
          <div className="mb-6">
            <label
              htmlFor="username-input"
              className="block text-xl font-medium text-gray-700 mb-2"
            >
              Usuario
            </label>
            {/* Username input field (colors unchanged) */}
            <input
              type="text"
              id="username-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 border bg-white border-gray-300 rounded-md focus:ring-green-600 focus:border-green-600 text-lg"
              aria-label="Username"
              required
            />
          </div>

          <div className="mb-8">
            <label
              htmlFor="password-input"
              className="block text-xl font-medium text-gray-700 mb-2"
            >
              Contraseña
            </label>
            <div className="relative">
              {/* Password input field (colors unchanged) */}
              <input
                type={showPassword ? "text" : "password"}
                id="password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-white border rounded-md border-gray-300 rounded-md focus:ring-green-600 focus:border-green-600 text-lg pr-12"
                aria-label="Password"
                required
              />
              {/* Password visibility toggle button (colors unchanged) */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-6 w-6" />
                ) : (
                  <EyeIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Login button (colors unchanged) */}
          <button
            type="submit"
            className="w-full py-4 bg-[#3B4D36] text-[#D4BD80] rounded-md hover:bg-green-800 focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 text-xl flex items-center justify-center gap-3 transition-colors duration-200"
          >
            Ingresar
            <ArrowRightIcon className="h-6 w-6" />
          </button>
        </form>
      </div>
      {/* Right Panel: This panel now has the green background color and the patterned image */}
      <div className="flex-1 bg-[#344838] relative overflow-hidden">
        {/* The user's provided background image for the right panel */}
        {/* We use mix-blend-multiply to tint the black and white image with the green background */}
        {/* Adjust opacity to control the visibility of the pattern */}
        <Image
          src="/images/LogInBackground.png" // This is the image that needs to be tinted green
          alt="Decorative Background Pattern"
          fill // Fills the parent div
          style={{ objectFit: "cover" }} // Covers the area without distortion
          className="mix-blend-multiply opacity-50" // Apply blend mode and opacity for green tint
        />
      </div>
    </div>
  );
};

export default LoginScreen;
