// src/hooks/useWeather.ts
import { useState, useEffect } from 'react';

interface WeatherData {
  description: string;
  temperature: number;
  icon: string;
  city: string;
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs only on the client
    if (typeof window === 'undefined') {
      setIsLoadingWeather(false); // No weather on server
      return;
    }

    const fetchWeather = async (latitude: number, longitude: number) => {
      const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY; // Get your API key from environment variables
      if (!API_KEY) {
        setWeatherError("OpenWeatherMap API Key not configured.");
        setIsLoadingWeather(false);
        return;
      }

      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=es`
        ); // units=metric for Celsius, lang=es for Spanish description
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        setWeather({
          description: data.weather[0].description,
          temperature: Math.round(data.main.temp), // Round to nearest integer
          icon: data.weather[0].icon,
          city: data.name,
        });
        setIsLoadingWeather(false);
      } catch (error) {
        console.error("Error fetching weather data:", error);
        setWeatherError("No se pudo cargar el clima.");
        setIsLoadingWeather(false);
      }
    };

    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeather(position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.error("Error getting user location:", error);
            setWeatherError("Permiso de ubicación denegado o no disponible.");
            setIsLoadingWeather(false);
          }
        );
      } else {
        setWeatherError("Geolocalización no soportada por este navegador.");
        setIsLoadingWeather(false);
      }
    };

    getLocation(); // Start the process of getting location and then weather
  }, []); // Empty dependency array means this runs once on mount (client-side)

  return { weather, isLoadingWeather, weatherError };
}