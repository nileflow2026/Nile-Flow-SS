/* eslint-disable react-hooks/immutability */
/* eslint-disable no-unused-vars */
// src/rider/components/LocationTracker.jsx
import { useEffect, useRef } from "react";
import { useRiderAuth } from "../Context/RiderAuthContext";
import riderAxiosClient from "../api/riderAxiosClient";

export const LocationTracker = () => {
  const { rider } = useRiderAuth();
  const watchIdRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (rider?.status === "online" || rider?.status === "busy") {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      mountedRef.current = false;
      stopTracking();
    };
  }, [rider?.status]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      return;
    }

    // Use less aggressive settings to prevent timeout errors
    const options = {
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 120000,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        if (!mountedRef.current) return;
        try {
          await riderAxiosClient.patch("/api/rider/profile/location", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        } catch {
          // Silently handle — location updates are non-critical
        }
      },
      () => {
        // Timeout or error — retry with one-shot position
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            if (!mountedRef.current) return;
            try {
              await riderAxiosClient.patch("/api/rider/profile/location", {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              });
            } catch {
              // non-critical
            }
          },
          () => {},
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
        );
      },
      options,
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  return null; // This is a background component
};
