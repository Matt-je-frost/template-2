'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import SearchForm from './components/SearchForm';
import ResultsList from './components/ResultsList';

// Map category to search keywords
const categoryKeywords = {
  'Bars and Clubs': '(gay OR queer OR lgbt OR lgbtq OR lgbtq+ OR lesbian OR bi) (bar OR club OR pub OR nightlife OR nightclub OR venue OR cabaret OR "drag show" OR "drag queen" OR "drag king")',
  
  'Sports': '(gay OR queer OR lgbt OR lgbtq OR lgbtq+ OR lesbian OR bi) (sports OR fitness OR gym OR swimming OR football OR rugby OR tennis OR volleyball OR athletics OR running OR basketball OR hockey OR cricket OR boxing)',
  
  'Chemsex Support': '(gay OR queer OR lgbt OR msm) (chemsex OR "chem sex" OR chems OR "chem addiction" OR "chemsex support" OR "chem sex support")',
  
  'Sexual Health Centres': '(gay OR queer OR lgbt OR lgbtq OR lgbtq+ OR lesbian OR bi OR msm) ("sexual health" OR std OR sti OR clinic OR "health centre" OR "health center" OR prep OR screening OR testing)',
  
  'Community Groups': '(gay OR queer OR lgbt OR lgbtq OR lgbtq+ OR lesbian OR bi) (community OR support OR social OR group OR charity OR center OR centre OR youth OR pride OR meetup OR network)'
} as const;

interface ExtendedPlaceResult extends google.maps.places.PlaceResult {
  distance?: number;
}

interface PlaceResult {
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

export default function Home() {
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    // Initialize map and places service when Google Maps is loaded
    const initMap = () => {
      if (!window.google) {
        setTimeout(initMap, 100);
        return;
      }

      const mapElement = document.getElementById('map-container');
      if (mapElement && !mapRef.current) {
        mapRef.current = new google.maps.Map(mapElement, {
          center: { lat: 51.5074, lng: -0.1278 }, // London coordinates
          zoom: 13,
        });
        placesServiceRef.current = new google.maps.places.PlacesService(mapRef.current);
      }
    };

    initMap();
  }, []);

  const handleSearch = async (
    location: google.maps.LatLngLiteral,
    category: string
  ) => {
    console.log('Search initiated with:', { location, category });
    setIsLoading(true);
    setHasSearched(true);

    if (!placesServiceRef.current) {
      console.error('Places service not initialized');
      setIsLoading(false);
      return;
    }

    try {
      const searchQuery = categoryKeywords[category as keyof typeof categoryKeywords] || '';
      console.log('Using search query:', searchQuery);

      // First try with establishment type
      const request: google.maps.places.PlaceSearchRequest = {
        location: location,
        radius: 50000, // 50km radius
        keyword: searchQuery,
        type: 'establishment'
      };

      placesServiceRef.current.nearbySearch(
        request,
        async (
          results: google.maps.places.PlaceResult[] | null,
          status: google.maps.places.PlacesServiceStatus
        ) => {
          console.log('Search status:', status);

          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Calculate distances for all results
            const resultsWithDistance = results.map(place => {
              const distance = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(location),
                place.geometry?.location || new google.maps.LatLng(location)
              );
              return { ...place, distance } as ExtendedPlaceResult;
            });

            // Function to get place details
            const getPlaceDetails = async (place: ExtendedPlaceResult) => {
              return new Promise<ExtendedPlaceResult>((resolve) => {
                if (!placesServiceRef.current) {
                  resolve(place);
                  return;
                }

                placesServiceRef.current.getDetails(
                  {
                    placeId: place.place_id!,
                    fields: ['website', 'url']
                  },
                  (details) => {
                    resolve({
                      ...place,
                      website: details?.website || details?.url || undefined
                    } as ExtendedPlaceResult);
                  }
                );
              });
            };

            // If we have less than 10 results, try another search without type restriction
            if (resultsWithDistance.length < 10) {
              const secondRequest = {
                ...request,
                type: undefined // Remove type restriction
              };

              if (!placesServiceRef.current) {
                setIsLoading(false);
                return;
              }

              placesServiceRef.current.nearbySearch(
                secondRequest,
                async (
                  moreResults: google.maps.places.PlaceResult[] | null,
                  secondStatus: google.maps.places.PlacesServiceStatus
                ) => {
                  if (secondStatus === google.maps.places.PlacesServiceStatus.OK && moreResults) {
                    // Filter out duplicates and add new results
                    const existingIds = new Set(resultsWithDistance.map(r => r.place_id));
                    const newResults = moreResults.filter(r => !existingIds.has(r.place_id));
                    
                    // Add distances to new results
                    const newResultsWithDistance = newResults.map(place => {
                      const distance = google.maps.geometry.spherical.computeDistanceBetween(
                        new google.maps.LatLng(location),
                        place.geometry?.location || new google.maps.LatLng(location)
                      );
                      return { ...place, distance } as ExtendedPlaceResult;
                    });

                    // Combine all results
                    const allResults = [...resultsWithDistance, ...newResultsWithDistance];

                    // Get details for each place
                    const resultsWithDetails = await Promise.all(
                      allResults.map(place => getPlaceDetails(place))
                    );

                    const formattedResults: PlaceResult[] = resultsWithDetails.map((place) => ({
                      id: place.place_id || Math.random().toString(),
                      name: place.name || 'Unknown Location',
                      category: category,
                      address: place.vicinity || '',
                      rating: place.rating,
                      website: place.website,
                      coordinates: {
                        lat: place.geometry?.location?.lat() || 0,
                        lng: place.geometry?.location?.lng() || 0
                      },
                      distance: `${(place.distance! / 1609.34).toFixed(1)} miles`
                    }));

                    setSearchResults(formattedResults);
                  } else {
                    // If second search fails, use results from first search with details
                    const resultsWithDetails = await Promise.all(
                      resultsWithDistance.map(place => getPlaceDetails(place))
                    );

                    const formattedResults: PlaceResult[] = resultsWithDetails.map((place) => ({
                      id: place.place_id || Math.random().toString(),
                      name: place.name || 'Unknown Location',
                      category: category,
                      address: place.vicinity || '',
                      rating: place.rating,
                      website: place.website,
                      coordinates: {
                        lat: place.geometry?.location?.lat() || 0,
                        lng: place.geometry?.location?.lng() || 0
                      },
                      distance: `${(place.distance! / 1609.34).toFixed(1)} miles`
                    }));

                    setSearchResults(formattedResults);
                  }
                  setIsLoading(false);
                }
              );
            } else {
              // If we already have enough results, use them with details
              const resultsWithDetails = await Promise.all(
                resultsWithDistance.map(place => getPlaceDetails(place))
              );

              const formattedResults: PlaceResult[] = resultsWithDetails.map((place) => ({
                id: place.place_id || Math.random().toString(),
                name: place.name || 'Unknown Location',
                category: category,
                address: place.vicinity || '',
                rating: place.rating,
                website: place.website,
                coordinates: {
                  lat: place.geometry?.location?.lat() || 0,
                  lng: place.geometry?.location?.lng() || 0
                },
                distance: `${(place.distance! / 1609.34).toFixed(1)} miles`
              }));

              setSearchResults(formattedResults);
              setIsLoading(false);
            }
          } else {
            console.error('Places search failed:', status);
            setSearchResults([]);
            setIsLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('Error searching places:', error);
      setSearchResults([]);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 relative">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"></div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-6">
          <div className="py-2">
            <Image
              src="/gay2z_logo.png"
              alt="Gay 2 Z"
              width={1500}
              height={562}
              priority
              className="mx-auto w-auto h-auto max-w-[98vw] md:max-w-[900px] lg:max-w-[1200px] xl:max-w-[1500px] 2xl:max-w-[1800px] transition-transform duration-300 hover:scale-105"
            />
          </div>
          <p className="text-xl md:text-2xl text-white font-bubblegum mt-2">
            Find LGBTQ+ friendly services in your area
          </p>
        </div>

        <SearchForm onSearch={handleSearch} />
        
        {isLoading ? (
          <div className="glass-container p-6 mt-6 text-center">
            <p className="text-white">Searching for locations...</p>
          </div>
        ) : (
          hasSearched && <ResultsList results={searchResults} />
        )}
      </div>
    </main>
  );
}
