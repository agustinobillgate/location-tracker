const socket = io();
const mapboxToken = 'pk.eyJ1IjoiYWd1c3Rpbm9iaWxsIiwiYSI6ImNscDZqbXI4YTF4bTMyaXM2anQyNTIzam8ifQ.m0_3YDhlYa_V6wt3mvVLyQ';

mapboxgl.accessToken = mapboxToken;
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [0, 0],
  zoom: 2,
});

map.on('load', () => {
  getUserLocation();
  socket.on('updateLocation', (data) => {
    updateMap(data.id, data.location);
  });
  socket.on('broadcastAllLocations', (allLocations) => {
    Object.keys(allLocations).forEach(userId => {
      const location = allLocations[userId].location;
      updateMap(userId, location);
    });
  });
});

function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        socket.emit('locationUpdate', userLocation);
        reverseGeocode(userLocation);
        map.flyTo({
          center: [userLocation.longitude, userLocation.latitude],
          zoom: 20,
        });
      },
      (error) => {
        console.error('Error getting user location:', error.message);
      }
    );
  } else {
    console.error('Geolocation is not supported by this browser.');
  }
}

function reverseGeocode(location) {
  const apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.longitude},${location.latitude}.json?access_token=${mapboxToken}`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      const locationName = data.features[0].place_name;
      console.log('Location:', locationName);
    })
    .catch(error => {
      console.error('Error in reverse geocoding:', error);
    });
}

function updateMap(id, location) {
  if (!map.getSource(id)) {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      },
    });
    map.addLayer({
      id: id,
      type: 'circle',
      source: id,
      paint: {
        'circle-radius': 10,
        'circle-color': '#FF0000',
      },
    });
  } else {
    map.getSource(id).setData({
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
    });
  }
}