import fetch from "node-fetch";

// Response interfaces
interface GoogleMapsResponse {
  status: string;
  error_message?: string;
}

interface GeocodeResponse extends GoogleMapsResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_id: string;
  }>;
}

interface PlacesSearchResponse extends GoogleMapsResponse {
  results: Array<{
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_id: string;
    rating?: number;
    types: string[];
  }>;
}

interface PlaceDetailsResponse extends GoogleMapsResponse {
  result: {
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_phone_number?: string;
    website?: string;
    rating?: number;
    reviews?: Array<{
      author_name: string;
      rating: number;
      text: string;
      time: number;
    }>;
    opening_hours?: {
      open_now: boolean;
      periods: Array<{
        open: {
          day: number;
          time: string;
        };
        close: {
          day: number;
          time: string;
        };
      }>;
    };
  };
}

interface DistanceMatrixResponse extends GoogleMapsResponse {
  origin_addresses: string[];
  destination_addresses: string[];
  rows: Array<{
    elements: Array<{
      status: string;
      duration: {
        text: string;
        value: number;
      };
      distance: {
        text: string;
        value: number;
      };
    }>;
  }>;
}

interface ElevationResponse extends GoogleMapsResponse {
  results: Array<{
    elevation: number;
    location: {
      lat: number;
      lng: number;
    };
    resolution: number;
  }>;
}

interface DirectionsResponse extends GoogleMapsResponse {
  routes: Array<{
    summary: string;
    legs: Array<{
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
      steps: Array<{
        html_instructions: string;
        distance: {
          text: string;
          value: number;
        };
        duration: {
          text: string;
          value: number;
        };
        travel_mode: string;
      }>;
    }>;
  }>;
}

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_MAPS_API_KEY environment variable is not set");
    process.exit(1);
  }
  return apiKey;
}

const GOOGLE_MAPS_API_KEY = getApiKey();

const geocodeTool: Tool = {
  id: 'maps_geocode',
  name: 'Google Maps Geocode',
  description: 'Convert an address to coordinates',
  parameters: [
    {
      name: 'address',
      type: 'string',
      description: 'Address to geocode',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.append("address", params.address);
    url.searchParams.append("key", GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json() as GeocodeResponse;

    if (data.status !== "OK") {
      return JSON.stringify({
        error: `Geocoding failed: ${data.error_message || data.status}`
      });
    }

    return JSON.stringify({
      location: data.results[0].geometry.location,
      formatted_address: data.results[0].formatted_address,
      place_id: data.results[0].place_id
    });
  },
};

const reverseGeocodeTool: Tool = {
  id: 'maps_reverse_geocode',
  name: 'Google Maps Reverse Geocode',
  description: 'Convert coordinates to an address',
  parameters: [
    {
      name: 'lat',
      type: 'number',
      description: 'Latitude coordinate',
      required: true,
    },
    {
      name: 'lng',
      type: 'number',
      description: 'Longitude coordinate',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.append("latlng", `${params.lat},${params.lng}`);
    url.searchParams.append("key", GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json() as GeocodeResponse;

    if (data.status !== "OK") {
      return JSON.stringify({
        error: `Reverse geocoding failed: ${data.error_message || data.status}`
      });
    }

    return JSON.stringify({
      formatted_address: data.results[0].formatted_address,
      place_id: data.results[0].place_id,
      address_components: data.results[0].address_components
    });
  },
};

const searchPlacesTool: Tool = {
  id: 'maps_search_places',
  name: 'Google Maps Search Places',
  description: 'Search for places by text query',
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'Search query for places',
      required: true,
    },
    {
      name: 'location',
      type: 'string',
      description: 'Location to search around (address or lat,lng)',
      required: false,
    },
    {
      name: 'radius',
      type: 'number',
      description: 'Search radius in meters',
      required: false,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.append("query", params.query);
    url.searchParams.append("key", GOOGLE_MAPS_API_KEY);

    if (params.location) {
      url.searchParams.append("location", params.location);
    }
    if (params.radius) {
      url.searchParams.append("radius", params.radius.toString());
    }

    const response = await fetch(url.toString());
    const data = await response.json() as PlacesSearchResponse;

    if (data.status !== "OK") {
      return JSON.stringify({
        error: `Place search failed: ${data.error_message || data.status}`
      });
    }

    return JSON.stringify({
      places: data.results.map((place) => ({
        name: place.name,
        formatted_address: place.formatted_address,
        location: place.geometry.location,
        place_id: place.place_id,
        rating: place.rating,
        types: place.types
      }))
    });
  },
};

const placeDetailsTool: Tool = {
  id: 'maps_place_details',
  name: 'Google Maps Place Details',
  description: 'Get detailed information about a place',
  parameters: [
    {
      name: 'place_id',
      type: 'string',
      description: 'Google Places ID of the location',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.append("place_id", params.place_id);
    url.searchParams.append("key", GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json() as PlaceDetailsResponse;

    if (data.status !== "OK") {
      return JSON.stringify({
        error: `Place details request failed: ${data.error_message || data.status}`
      });
    }

    return JSON.stringify({
      name: data.result.name,
      formatted_address: data.result.formatted_address,
      location: data.result.geometry.location,
      formatted_phone_number: data.result.formatted_phone_number,
      website: data.result.website,
      rating: data.result.rating,
      reviews: data.result.reviews,
      opening_hours: data.result.opening_hours
    });
  },
};

const distanceMatrixTool: Tool = {
  id: 'maps_distance_matrix',
  name: 'Google Maps Distance Matrix',
  description: 'Calculate travel distance and time between points',
  parameters: [
    {
      name: 'origins',
      type: 'string',
      description: 'Starting points (addresses or lat,lng)',
      required: true,
    },
    {
      name: 'destinations',
      type: 'string',
      description: 'Ending points (addresses or lat,lng)',
      required: true,
    },
    {
      name: 'mode',
      type: 'string',
      description: 'Travel mode (driving, walking, bicycling, transit)',
      required: false,
      defaultValue: 'driving'
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.append("origins", params.origins);
    url.searchParams.append("destinations", params.destinations);
    url.searchParams.append("mode", params.mode || 'driving');
    url.searchParams.append("key", GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json() as DistanceMatrixResponse;

    if (data.status !== "OK") {
      return JSON.stringify({
        error: `Distance matrix request failed: ${data.error_message || data.status}`
      });
    }

    return JSON.stringify({
      origin_addresses: data.origin_addresses,
      destination_addresses: data.destination_addresses,
      results: data.rows.map((row) => ({
        elements: row.elements.map((element) => ({
          status: element.status,
          duration: element.duration,
          distance: element.distance
        }))
      }))
    });
  },
};

const elevationTool: Tool = {
  id: 'maps_elevation',
  name: 'Google Maps Elevation',
  description: 'Get elevation data for locations',
  parameters: [
    {
      name: 'locations',
      type: 'string',
      description: 'Locations to get elevation for (lat,lng pairs)',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const url = new URL("https://maps.googleapis.com/maps/api/elevation/json");
    url.searchParams.append("locations", params.locations);
    url.searchParams.append("key", GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json() as ElevationResponse;

    if (data.status !== "OK") {
      return JSON.stringify({
        error: `Elevation request failed: ${data.error_message || data.status}`
      });
    }

    return JSON.stringify({
      results: data.results.map((result) => ({
        elevation: result.elevation,
        location: result.location,
        resolution: result.resolution
      }))
    });
  },
};

const directionsTool: Tool = {
  id: 'maps_directions',
  name: 'Google Maps Directions',
  description: 'Get directions between two points',
  parameters: [
    {
      name: 'origin',
      type: 'string',
      description: 'Starting point address or coordinates',
      required: true,
    },
    {
      name: 'destination',
      type: 'string',
      description: 'Ending point address or coordinates',
      required: true,
    },
    {
      name: 'mode',
      type: 'string',
      description: 'Travel mode (driving, walking, bicycling, transit)',
      required: false,
      defaultValue: 'driving'
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.append("origin", params.origin);
    url.searchParams.append("destination", params.destination);
    url.searchParams.append("mode", params.mode || 'driving');
    url.searchParams.append("key", GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json() as DirectionsResponse;

    if (data.status !== "OK") {
      return JSON.stringify({
        error: `Directions request failed: ${data.error_message || data.status}`
      });
    }

    return JSON.stringify({
      routes: data.routes.map((route) => ({
        summary: route.summary,
        distance: route.legs[0].distance,
        duration: route.legs[0].duration,
        steps: route.legs[0].steps.map((step) => ({
          instructions: step.html_instructions,
          distance: step.distance,
          duration: step.duration,
          travel_mode: step.travel_mode
        }))
      }))
    });
  },
};

const tools = [
  geocodeTool,
  reverseGeocodeTool,
  searchPlacesTool,
  placeDetailsTool,
  distanceMatrixTool,
  elevationTool,
  directionsTool
];

export { tools };