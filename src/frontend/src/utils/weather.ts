// src/hooks/useWeather.ts
import { useState, useEffect } from 'react';
import { externalHttp } from '../services/externalHttp';

interface WeatherData {
  description: string;
  temperature: number;
  icon: string;
  city: string;
}

const FALLBACK_LOCATION = {
  latitude: Number(process.env.NEXT_PUBLIC_DEFAULT_LATITUDE || 9.9281),
  longitude: Number(process.env.NEXT_PUBLIC_DEFAULT_LONGITUDE || -84.0907),
  label: process.env.NEXT_PUBLIC_DEFAULT_CITY || 'San José',
};

interface OpenWeatherResponse {
  weather: Array<{ description: string; icon: string }>;
  main: { temp: number };
  name: string;
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoadingWeather(false);
      return;
    }

    const fetchWeather = async (
      latitude: number,
      longitude: number,
      forcedCityName?: string
    ) => {
      const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      if (!API_KEY) {
        setWeatherError('OpenWeatherMap API Key not configured.');
        setIsLoadingWeather(false);
        return;
      }

      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=es`;
        const data = await externalHttp.get<OpenWeatherResponse>(url);

        const weatherObj = data.weather?.[0];
        const mainObj = data.main;

        if (weatherObj && mainObj) {
          setWeather({
            description: weatherObj.description,
            temperature: Math.round(mainObj.temp),
            icon: weatherObj.icon,
            city: data.name || forcedCityName || FALLBACK_LOCATION.label,
          });
        } else {
          throw new Error('Malformed weather data');
        }
        setIsLoadingWeather(false);
        setWeatherError(null);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setWeatherError('No se pudo cargar el clima.');
        setIsLoadingWeather(false);
      }
    };

    const fallbackToDefault = (message: string) => {
      console.warn(`[weather] ${message}, usando ubicación por defecto.`);
      fetchWeather(
        FALLBACK_LOCATION.latitude,
        FALLBACK_LOCATION.longitude,
        FALLBACK_LOCATION.label
      );
    };

    const getLocation = () => {
      const isSecure =
        window.isSecureContext || window.location.hostname === 'localhost';

      if (!navigator.geolocation || !isSecure) {
        fallbackToDefault(
          !navigator.geolocation
            ? 'Geolocalización no soportada por este navegador.'
            : 'Geolocalización bloqueada en contextos no seguros.'
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          fallbackToDefault(
            `No se pudo obtener la ubicación del usuario (${error.message}).`
          );
        }
      );
    };

    getLocation();
  }, []);

  return { weather, isLoadingWeather, weatherError };
}
