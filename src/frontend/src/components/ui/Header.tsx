"use client";
import Image from "next/image";
import { getCurrentSpanishFormattedDateString } from "@/utils/time";
import { useUser } from "@/hooks/user";
import { useWeather } from "@/utils/weather";

export default function Header() {
  const { user, isUserLoaded } = useUser();
  const currentDate = getCurrentSpanishFormattedDateString();
  const { weather: currentWeather, isLoadingWeather } = useWeather();

  return (
    <header className="bg-[#FCF1D5] p-4 flex items-center justify-between shadow-sm border-b border-[#FCF1D5]">
      <div>
        <h1 className="text-24px text-[#3B4D36]">
          Bienvenido de vuelta, {isUserLoaded ? user : "Cargando..."}
        </h1>
        <p className="text-20px text-[#D9C28B]">
          {" "}
          {currentDate} |{" "}
          {isLoadingWeather
            ? "Cargando clima..."
            : `Día de ${currentWeather?.description} en ${currentWeather?.city}`}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        {/* Notification Bell Icon */}
        <div className="relative w-10 h-10 rounded-full border border-[rgba(184,179,166,0.37)] flex items-center justify-center text-[#4A5D3A] text-xl cursor-pointer">
          <Image
            src={"/images/layout/notification.png"}
            alt="Notification Bell"
            width={42}
            height={42}
          />
        </div>
      </div>
    </header>
  );
}
