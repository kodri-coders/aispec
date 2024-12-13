import { Tool } from '@aispec/tool-types';
import fetch from 'node-fetch';

interface DirectionsResponse extends GoogleMapsResponse {
  routes: {
    legs: {
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
      steps: {
        distance: {
          text: string;
          value: number;
        };
        duration: {
          text: string;
          value: number;
        };
        html_instructions: string;
        travel_mode: string;
      }[];
    }[];
    summary: string;
  }[];
}

interface DistanceMatrixResponse extends GoogleMapsResponse {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: {
    elements: {
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
      status: string;
    }[];
  }[];
}

interface ElevationResponse extends GoogleMapsResponse {
  results: {
    elevation: number;
    location: {
      lat: number;
      lng: number;
    };
    resolution: number;
  }[];
}

interface GeocodeResponse extends GoogleMapsResponse {
  results: {
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_id: string;
  }[];
}

// Response interfaces
interface GoogleMapsResponse {
  error_message?: string;
  status: string;
}

interface PlaceDetailsResponse extends GoogleMapsResponse {
  result: {
    formatted_address: string;
    formatted_phone_number?: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    name: string;
    opening_hours?: {
      open_now: boolean;
      periods: {
        close: {
          day: number;
          time: string;
        };
        open: {
          day: number;
          time: string;
        };
      }[];
    };
    rating?: number;
    reviews?: {
      author_name: string;
      rating: number;
      text: string;
      time: number;
    }[];
    website?: string;
  };
}

interface PlacesSearchResponse extends GoogleMapsResponse {
  results: {
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    name: string;
    place_id: string;
    rating?: number;
    types: string[];
  }[];
}

/**
 *
 */
function getApiKey(): string {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY environment variable is not set');
    process.exit(1);
  }
  return apiKey;
}

const GOOGLE_MAPS_API_KEY = getApiKey();

const geocodeTool: Tool = {
  description: 'Convert an address to coordinates',
  handler: async (params: any) => {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('address', params.address);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = (await response.json()) as GeocodeResponse;

    if (data.status !== 'OK') {
      return JSON.stringify({
        error: `Geocoding failed: ${data.error_message || data.status}`,
      });
    }

    return JSON.stringify({
      formatted_address: data.results[0].formatted_address,
      location: data.results[0].geometry.location,
      place_id: data.results[0].place_id,
    });
  },
  id: 'maps_geocode',
  name: 'Google Maps Geocode',
  parameters: [
    {
      description: 'Address to geocode',
      name: 'address',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const reverseGeocodeTool: Tool = {
  description: 'Convert coordinates to an address',
  handler: async (params: any) => {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('latlng', `${params.lat},${params.lng}`);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = (await response.json()) as GeocodeResponse;

    if (data.status !== 'OK') {
      return JSON.stringify({
        error: `Reverse geocoding failed: ${data.error_message || data.status}`,
      });
    }

    return JSON.stringify({
      formatted_address: data.results[0].formatted_address,
      place_id: data.results[0].place_id,
      // address_components: data.results[0].address_components,
    });
  },
  id: 'maps_reverse_geocode',
  name: 'Google Maps Reverse Geocode',
  parameters: [
    {
      description: 'Latitude coordinate',
      name: 'lat',
      required: true,
      type: 'number',
    },
    {
      description: 'Longitude coordinate',
      name: 'lng',
      required: true,
      type: 'number',
    },
  ],
  returnType: 'string',
};

const searchPlacesTool: Tool = {
  description: 'Search for places by text query',
  handler: async (params: any) => {
    const url = new URL(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
    );
    url.searchParams.append('query', params.query);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    if (params.location) {
      url.searchParams.append('location', params.location);
    }
    if (params.radius) {
      url.searchParams.append('radius', params.radius.toString());
    }

    const response = await fetch(url.toString());
    const data = (await response.json()) as PlacesSearchResponse;

    if (data.status !== 'OK') {
      return JSON.stringify({
        error: `Place search failed: ${data.error_message || data.status}`,
      });
    }

    return JSON.stringify({
      places: data.results.map(place => ({
        formatted_address: place.formatted_address,
        location: place.geometry.location,
        name: place.name,
        place_id: place.place_id,
        rating: place.rating,
        types: place.types,
      })),
    });
  },
  id: 'maps_search_places',
  name: 'Google Maps Search Places',
  parameters: [
    {
      description: 'Search query for places',
      name: 'query',
      required: true,
      type: 'string',
    },
    {
      description: 'Location to search around (address or lat,lng)',
      name: 'location',
      required: false,
      type: 'string',
    },
    {
      description: 'Search radius in meters',
      name: 'radius',
      required: false,
      type: 'number',
    },
  ],
  returnType: 'string',
};

const placeDetailsTool: Tool = {
  description: 'Get detailed information about a place',
  handler: async (params: any) => {
    const url = new URL(
      'https://maps.googleapis.com/maps/api/place/details/json',
    );
    url.searchParams.append('place_id', params.place_id);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = (await response.json()) as PlaceDetailsResponse;

    if (data.status !== 'OK') {
      return JSON.stringify({
        error: `Place details request failed: ${data.error_message || data.status}`,
      });
    }

    return JSON.stringify({
      formatted_address: data.result.formatted_address,
      formatted_phone_number: data.result.formatted_phone_number,
      location: data.result.geometry.location,
      name: data.result.name,
      opening_hours: data.result.opening_hours,
      rating: data.result.rating,
      reviews: data.result.reviews,
      website: data.result.website,
    });
  },
  id: 'maps_place_details',
  name: 'Google Maps Place Details',
  parameters: [
    {
      description: 'Google Places ID of the location',
      name: 'place_id',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const distanceMatrixTool: Tool = {
  description: 'Calculate travel distance and time between points',
  handler: async (params: any) => {
    const url = new URL(
      'https://maps.googleapis.com/maps/api/distancematrix/json',
    );
    url.searchParams.append('origins', params.origins);
    url.searchParams.append('destinations', params.destinations);
    url.searchParams.append('mode', params.mode || 'driving');
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = (await response.json()) as DistanceMatrixResponse;

    if (data.status !== 'OK') {
      return JSON.stringify({
        error: `Distance matrix request failed: ${data.error_message || data.status}`,
      });
    }

    return JSON.stringify({
      destination_addresses: data.destination_addresses,
      origin_addresses: data.origin_addresses,
      results: data.rows.map(row => ({
        elements: row.elements.map(element => ({
          distance: element.distance,
          duration: element.duration,
          status: element.status,
        })),
      })),
    });
  },
  id: 'maps_distance_matrix',
  name: 'Google Maps Distance Matrix',
  parameters: [
    {
      description: 'Starting points (addresses or lat,lng)',
      name: 'origins',
      required: true,
      type: 'string',
    },
    {
      description: 'Ending points (addresses or lat,lng)',
      name: 'destinations',
      required: true,
      type: 'string',
    },
    {
      defaultValue: 'driving',
      description: 'Travel mode (driving, walking, bicycling, transit)',
      name: 'mode',
      required: false,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const elevationTool: Tool = {
  description: 'Get elevation data for locations',
  handler: async (params: any) => {
    const url = new URL('https://maps.googleapis.com/maps/api/elevation/json');
    url.searchParams.append('locations', params.locations);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = (await response.json()) as ElevationResponse;

    if (data.status !== 'OK') {
      return JSON.stringify({
        error: `Elevation request failed: ${data.error_message || data.status}`,
      });
    }

    return JSON.stringify({
      results: data.results.map(result => ({
        elevation: result.elevation,
        location: result.location,
        resolution: result.resolution,
      })),
    });
  },
  id: 'maps_elevation',
  name: 'Google Maps Elevation',
  parameters: [
    {
      description: 'Locations to get elevation for (lat,lng pairs)',
      name: 'locations',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const directionsTool: Tool = {
  description: 'Get directions between two points',
  handler: async (params: any) => {
    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.append('origin', params.origin);
    url.searchParams.append('destination', params.destination);
    url.searchParams.append('mode', params.mode || 'driving');
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = (await response.json()) as DirectionsResponse;

    if (data.status !== 'OK') {
      return JSON.stringify({
        error: `Directions request failed: ${data.error_message || data.status}`,
      });
    }

    return JSON.stringify({
      routes: data.routes.map(route => ({
        distance: route.legs[0].distance,
        duration: route.legs[0].duration,
        steps: route.legs[0].steps.map(step => ({
          distance: step.distance,
          duration: step.duration,
          instructions: step.html_instructions,
          travel_mode: step.travel_mode,
        })),
        summary: route.summary,
      })),
    });
  },
  id: 'maps_directions',
  name: 'Google Maps Directions',
  parameters: [
    {
      description: 'Starting point address or coordinates',
      name: 'origin',
      required: true,
      type: 'string',
    },
    {
      description: 'Ending point address or coordinates',
      name: 'destination',
      required: true,
      type: 'string',
    },
    {
      defaultValue: 'driving',
      description: 'Travel mode (driving, walking, bicycling, transit)',
      name: 'mode',
      required: false,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const tools = [
  geocodeTool,
  reverseGeocodeTool,
  searchPlacesTool,
  placeDetailsTool,
  distanceMatrixTool,
  elevationTool,
  directionsTool,
];

export { tools };
