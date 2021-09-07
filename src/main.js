mapboxgl.accessToken = 'pk.eyJ1Ijoid2lsZnJlZGJheXVkYW4iLCJhIjoiY2t0NDFyMGR2MG04ZjJvcno3aTY2Y3FpeCJ9.7AtfTdy1H6N1KpasnQ4axw';
var map = new mapboxgl.Map({
container: 'map',
style: 'mapbox://styles/mapbox/streets-v11'
});
function easeMe() {
  // Using easeTo options.
  map.easeTo({
  center: [2.352222, 48.856614],
  zoom: 4,
  speed: 0.3,
  curve: 1,
  duration: 1000,
  easing(t) {
  return t;
  }
  });
}