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

const app = document.querySelector('#app');
const nav = document.querySelector('nav a');

nav.addEventListener('click', () => {
  toggleActive(nav);
  toggleAppDisplay();
})

app.addEventListener('click', () => {
  if (app.className !== 'active') {
    toggleAppDisplay();
  }
})

function toggleActive(element) {
  element.classList.toggle('active');
}

function toggleAppDisplay() {
  if (window.matchMedia('(min-width: 768px)')) {
    toggleActive(app);
  }
}