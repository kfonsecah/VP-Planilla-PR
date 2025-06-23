"use client";
import Image from "next/image";
import { getCurrentSpanishFormattedDateString } from "@/utils/time";
import { useWeather } from "@/utils/weather";
import { useState, useEffect } from "react";

interface AuthenticatedUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  role: string;
}

export default function Header() {
  const currentDate = getCurrentSpanishFormattedDateString();
  const { weather: currentWeather, isLoadingWeather } = useWeather();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Notificaciones de ejemplo
  const notifications = [
    {
      id: 1,
      title: "Quincena de Pago",
      message: "La quincena de pago se procesará mañana",
      time: "Hace 2 horas",
      type: "payment",
      unread: true
    },
    {
      id: 2,
      title: "Registro de Asistencia",
      message: "3 empleados no han marcado salida",
      time: "Hace 4 horas",
      type: "attendance",
      unread: true
    },
    {
      id: 3,
      title: "Reporte Mensual",
      message: "El reporte de junio está listo para revisión",
      time: "Hace 1 día",
      type: "report",
      unread: false
    },
    {
      id: 4,
      title: "Nuevo Empleado",
      message: "Se ha registrado un nuevo empleado en el sistema",
      time: "Hace 2 días",
      type: "employee",
      unread: false
    }
  ];
  useEffect(() => {
    // Obtener usuario del localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Cerrar notificaciones al hacer click fuera
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);
  // Función para obtener el nombre completo del usuario
  const getFullName = () => {
    if (!currentUser) return "Usuario";

    const { first_name, middle_name, last_name } = currentUser;
    
    // Construir nombre completo, manejando valores nulos o vacíos
    const nameParts = [
      first_name?.trim(),
      middle_name?.trim(), 
      last_name?.trim()
    ].filter(Boolean); // Filtra valores falsy (null, undefined, "")    return nameParts.length > 0 ? nameParts.join(" ") : "Usuario";
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const unreadCount = notifications.filter(n => n.unread).length;
  return (
    <header className="bg-[#FCF1D5] px-6 py-3 flex items-center justify-between shadow-sm border-b border-[#D4C89A]">
      <div>        <h1 className="text-base font-medium text-[#4A5D3A] leading-tight">
          Bienvenido de vuelta, {getFullName()}
        </h1>
        <p className="text-sm text-[#D9C38B] mt-0.5">
          {currentDate} |{" "}
          {isLoadingWeather
            ? "Cargando clima..."
            : `Día de ${currentWeather?.description} en ${currentWeather?.city}`}
        </p>
      </div>      <div className="flex items-center space-x-3 relative notification-container">        {/* Notification Bell Icon */}
        <div 
          className="relative w-8 h-8 rounded-full border border-[rgba(184,179,166,0.37)] flex items-center justify-center text-[#4A5D3A] cursor-pointer hover:bg-[#F0E6D2] transition-colors"
          onClick={toggleNotifications}
        >
          <Image
            src={"/images/layout/notification.png"}
            alt="Notification Bell"
            width={28}
            height={28}
          />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {unreadCount}
            </div>
          )}
        </div>
      </div>

      {/* Notification Panel - Positioned as overlay */}
      {showNotifications && (
        <div className="fixed top-16 right-6 w-80 bg-white rounded-lg shadow-xl border border-[#E0D6B7] z-50 animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#F0EDE5] bg-[#FCF1D5] rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#4A5D3A] text-sm">Notificaciones</h3>
              <span className="text-xs text-[#6B7556]">{unreadCount} sin leer</span>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 border-b border-[#F8F6F1] hover:bg-[#FDFCF9] transition-colors cursor-pointer ${
                  notification.unread ? 'bg-[#FFF9E6]' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    notification.unread ? 'bg-blue-500' : 'bg-gray-300'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[#4A5D3A] truncate">
                        {notification.title}
                      </p>
                      <span className="text-xs text-[#8B8B8B] flex-shrink-0 ml-2">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7556] mt-1 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-[#F8F6F1] rounded-b-lg">
            <button className="text-xs text-[#4A5D3A] hover:text-[#2A3A1A] font-medium transition-colors">
              Ver todas las notificaciones
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
