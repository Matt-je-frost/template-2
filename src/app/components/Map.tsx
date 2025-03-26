'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Location {
  id: string;
  name: string;
  category: string;
  address: string;
  distance?: string;
  rating?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface MapProps {
  locations: Location[];
}

declare global {
  interface Window {
    google: any;
  }
}

export default function Map({ locations }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      try {
        // Default to London if no locations
        const defaultCenter = { lat: 51.5074, lng: -0.1278 };
        
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 12,
          center: locations.length > 0 ? locations[0].coordinates : defaultCenter,
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#242f3e' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#746855' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#242f3e' }]
            },
          ],
        });

        const bounds = new window.google.maps.LatLngBounds();
        const markers: google.maps.Marker[] = [];

        locations.forEach(location => {
          const marker = new window.google.maps.Marker({
            position: location.coordinates,
            map: map,
            title: location.name,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#FF1493',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            },
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="color: black; padding: 8px;">
                <h3 style="color: #FF1493; margin: 0 0 4px; font-weight: bold;">${location.name}</h3>
                <p style="margin: 0 0 4px;">${location.address}</p>
                <p style="margin: 0; color: #666;">${location.category}</p>
                ${location.distance ? `<p style="margin: 4px 0 0; color: #666;">${location.distance} away</p>` : ''}
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          bounds.extend(location.coordinates);
          markers.push(marker);
        });

        if (locations.length > 0) {
          map.fitBounds(bounds);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Error loading map. Please try again later.');
      }
    };

    // Check if Google Maps is loaded
    if (window.google && window.google.maps) {
      initMap();
    } else {
      setMapError('Google Maps is not loaded. Please refresh the page.');
    }
  }, [locations]);

  if (mapError) {
    return (
      <div className="h-[500px] bg-black/50 rounded-lg flex items-center justify-center">
        <p className="text-white text-center">{mapError}</p>
      </div>
    );
  }

  return (
    <div ref={mapRef} className="w-full h-[500px] rounded-lg" />
  );
} 