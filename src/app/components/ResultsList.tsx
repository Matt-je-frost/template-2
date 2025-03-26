'use client';

import React, { useState, useMemo } from 'react';
import Map from './Map';

interface Location {
  id: string;
  name: string;
  category: string;
  address: string;
  distance?: string;
  rating?: number;
  website?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface ResultsListProps {
  results: Location[];
}

type SortOption = 'distance' | 'rating';

export default function ResultsList({ results }: ResultsListProps) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<SortOption>('distance');

  const handleDirections = (location: Location) => {
    const destination = `${location.coordinates.lat},${location.coordinates.lng}`;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
  };

  const handleWebsite = (website: string) => {
    // Add https:// if not present
    const url = website.startsWith('http') ? website : `https://${website}`;
    window.open(url, '_blank');
  };

  // Sort results based on current sortBy value
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      // Sort by distance
      const distanceA = parseFloat(a.distance?.split(' ')[0] || '0');
      const distanceB = parseFloat(b.distance?.split(' ')[0] || '0');
      return distanceA - distanceB;
    });
  }, [results, sortBy]);

  return (
    <div className="glass-container p-4 mt-4 max-w-4xl mx-auto relative z-10">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Results</h2>
          {results.length > 0 && (
            <div className="flex gap-1.5">
              <button
                onClick={() => setSortBy('distance')}
                className={`text-xs py-0.5 px-2 rounded transition-colors ${
                  sortBy === 'distance'
                    ? 'bg-pink-500 text-white'
                    : 'bg-black/30 text-white/70 hover:bg-pink-500/20 border border-pink-500/30'
                }`}
              >
                Distance
              </button>
              <button
                onClick={() => setSortBy('rating')}
                className={`text-xs py-0.5 px-2 rounded transition-colors ${
                  sortBy === 'rating'
                    ? 'bg-pink-500 text-white'
                    : 'bg-black/30 text-white/70 hover:bg-pink-500/20 border border-pink-500/30'
                }`}
              >
                Rating
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setViewMode('list')}
            className={`text-xs py-0.5 px-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-pink-500 text-white'
                : 'bg-black/30 text-white/70 hover:bg-pink-500/20 border border-pink-500/30'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`text-xs py-0.5 px-2 rounded transition-colors ${
              viewMode === 'map'
                ? 'bg-pink-500 text-white'
                : 'bg-black/30 text-white/70 hover:bg-pink-500/20 border border-pink-500/30'
            }`}
          >
            Map
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-2">
          {results.length === 0 ? (
            <p className="text-white text-center">No results found</p>
          ) : (
            sortedResults.map((location) => (
              <div
                key={location.id}
                className="bg-black/30 p-2.5 rounded-lg border border-pink-500/30 hover:border-pink-500/50 transition-all"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-pink-500 truncate">{location.name}</h3>
                    <p className="text-gray-300 text-xs truncate">{location.address}</p>
                    <div className="flex justify-start items-center mt-1">
                      {location.distance && (
                        <span className="text-gray-400 text-xs">{location.distance} away</span>
                      )}
                    </div>
                  </div>
                  {location.rating && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <span className="text-pink-500 text-xs">{location.rating}</span>
                      <svg className="w-3.5 h-3.5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    onClick={() => handleDirections(location)}
                    className="text-xs py-0.5 px-2 rounded bg-pink-500 text-white hover:bg-pink-600 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Take Me There
                  </button>
                  {location.website && (
                    <button
                      onClick={() => handleWebsite(location.website!)}
                      className="text-xs py-0.5 px-2 rounded bg-pink-500 text-white hover:bg-pink-600 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Website
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <Map locations={sortedResults} />
      )}
    </div>
  );
} 