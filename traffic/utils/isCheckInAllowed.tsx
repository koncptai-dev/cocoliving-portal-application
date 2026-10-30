// utils/locationUtils.js

// Convert degrees to radians
const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };
  
  // Calculate the distance between two coordinates using the Haversine formula
  export const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };
  
  // Check if the given location is within any of the allowed zones
  export const isCheckinAllowed = (currentCoords, zones) => {
    return zones.some((zone) => {
      const distance = getDistanceFromLatLonInMeters(
        currentCoords.latitude,
        currentCoords.longitude,
        zone.center.latitude,
        zone.center.longitude
      );
      console.log(`Distance from zone ${zone.id}: ${distance} meters`);
      return distance <= zone.radius;
    });
  };
  