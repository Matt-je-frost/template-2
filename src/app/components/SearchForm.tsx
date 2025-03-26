'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

const categories = [
  'Bars and Clubs',
  'Sports',
  'Chemsex Support',
  'Sexual Health Centres',
  'Community Groups'
] as const;

interface SearchFormProps {
  onSearch: (location: google.maps.LatLngLiteral, category: string) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchLocation: google.maps.LatLngLiteral, category: string) => {
      onSearch(searchLocation, category);
      setIsLoading(false);
    }, 500),
    []
  );

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    const locationInput = locationInputRef.current?.value;
    if (!locationInput) {
      setError('Please enter a location');
      setIsLoading(false);
      return;
    }

    // Geocode the entered location with high precision
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { 
        address: locationInput,
        componentRestrictions: { country: 'gb' },
        region: 'gb'
      },
      (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results[0]) {
          // Check if we got a precise enough result
          const types = results[0].types || [];
          const preciseEnough = types.some(type => 
            ['street_address', 'premise', 'subpremise', 'postal_code'].includes(type)
          );

          if (!preciseEnough) {
            setError('Please enter a more specific address or postcode');
            setIsLoading(false);
            return;
          }

          const location = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          };
          debouncedSearch(location, category);
        } else {
          setError('Could not find this location. Please try another.');
          setIsLoading(false);
        }
      }
    );
  };

  const handleUseLocation = () => {
    setError(null);
    setIsLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: currentLocation },
            (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
              if (status === 'OK' && results[0]) {
                setLocation(results[0].formatted_address);
                if (locationInputRef.current) {
                  locationInputRef.current.value = results[0].formatted_address;
                }
              } else {
                setError('Could not find address for this location');
              }
              setIsLoading(false);
            }
          );
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your location. Please enter it manually');
          setIsLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setIsDropdownOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-container p-6 max-w-lg mx-auto relative z-[200]">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-500/20 border-2 border-red-500/50 text-white px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="flex flex-col space-y-2">
          <label htmlFor="location" className="text-white font-semibold">
            Location
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={locationInputRef}
                type="text"
                id="location"
                placeholder="Enter full address or postcode"
                className="search-input w-full pr-10"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={isLoading}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-pink-500 hover:text-pink-400 transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="Use my location"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-2" ref={dropdownRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isLoading}
              className={`search-input w-full text-left flex justify-between items-center ${
                !category ? 'text-gray-400' : 'text-white'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>{category || 'What are you looking for?'}</span>
              <svg
                className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute z-[999] w-full mt-1 bg-black/90 border-2 border-pink-500/30 rounded-lg shadow-lg backdrop-blur-sm">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className="w-full px-4 py-2 text-left text-white hover:bg-pink-500/20 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!category || isLoading}
          className={`primary-button w-full flex items-center justify-center gap-2 ${
            (!category || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Searching...</span>
            </>
          ) : (
            'Search'
          )}
        </button>
      </div>
    </form>
  );
} 