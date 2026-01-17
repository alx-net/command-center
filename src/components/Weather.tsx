"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
} from "lucide-react";

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  city: string;
}

const getWeatherIcon = (icon: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    "01d": <Sun className="w-16 h-16 text-yellow-400" />,
    "01n": <Sun className="w-16 h-16 text-yellow-200" />,
    "02d": <Cloud className="w-16 h-16 text-gray-300" />,
    "02n": <Cloud className="w-16 h-16 text-gray-400" />,
    "03d": <Cloud className="w-16 h-16 text-gray-400" />,
    "03n": <Cloud className="w-16 h-16 text-gray-500" />,
    "04d": <Cloud className="w-16 h-16 text-gray-500" />,
    "04n": <Cloud className="w-16 h-16 text-gray-600" />,
    "09d": <CloudRain className="w-16 h-16 text-blue-400" />,
    "09n": <CloudRain className="w-16 h-16 text-blue-500" />,
    "10d": <CloudRain className="w-16 h-16 text-blue-300" />,
    "10n": <CloudRain className="w-16 h-16 text-blue-400" />,
    "11d": <CloudLightning className="w-16 h-16 text-yellow-300" />,
    "11n": <CloudLightning className="w-16 h-16 text-yellow-400" />,
    "13d": <CloudSnow className="w-16 h-16 text-white" />,
    "13n": <CloudSnow className="w-16 h-16 text-gray-200" />,
  };
  return iconMap[icon] || <Cloud className="w-16 h-16 text-gray-400" />;
};

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
        if (!API_KEY) {
          setWeather({
            temp: 22,
            feels_like: 24,
            humidity: 65,
            wind_speed: 12,
            description: "Partly Cloudy",
            icon: "02d",
            city: "San Francisco",
          });
          setLoading(false);
          return;
        }

        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        const data = await res.json();

        setWeather({
          temp: Math.round(data.main.temp),
          feels_like: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          wind_speed: Math.round(data.wind.speed * 3.6),
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          city: data.name,
        });
      } catch {
        setError("Failed to fetch weather");
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(37.7749, -122.4194) // Default to SF
      );
    } else {
      fetchWeather(37.7749, -122.4194);
    }
  }, []);

  if (loading) {
    return (
      <div className="widget-card glow-border p-6 flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading weather...</div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="widget-card glow-border p-6 flex items-center justify-center">
        <div className="text-[var(--accent-magenta)]">{error || "No data"}</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="widget-card glow-border p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-4 h-4 text-[var(--accent-cyan)]" />
        <span className="text-[var(--text-secondary)] text-sm">
          {weather.city}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-5xl font-bold text-[var(--text-primary)]">
            {weather.temp}°
          </div>
          <div className="text-[var(--text-secondary)] capitalize mt-1">
            {weather.description}
          </div>
        </div>
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {getWeatherIcon(weather.icon)}
        </motion.div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-[var(--border-color)]">
        <div className="flex flex-col items-center">
          <Thermometer className="w-4 h-4 text-[var(--accent-orange)] mb-1" />
          <span className="text-xs text-[var(--text-muted)]">Feels like</span>
          <span className="text-sm font-medium">{weather.feels_like}°</span>
        </div>
        <div className="flex flex-col items-center">
          <Droplets className="w-4 h-4 text-[var(--accent-cyan)] mb-1" />
          <span className="text-xs text-[var(--text-muted)]">Humidity</span>
          <span className="text-sm font-medium">{weather.humidity}%</span>
        </div>
        <div className="flex flex-col items-center">
          <Wind className="w-4 h-4 text-[var(--accent-purple)] mb-1" />
          <span className="text-xs text-[var(--text-muted)]">Wind</span>
          <span className="text-sm font-medium">{weather.wind_speed} km/h</span>
        </div>
      </div>
    </motion.div>
  );
}
