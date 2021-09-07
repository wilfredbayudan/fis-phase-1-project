// MAPBOX
mapboxgl.accessToken = 'pk.eyJ1Ijoid2lsZnJlZGJheXVkYW4iLCJhIjoiY2t0NDFyMGR2MG04ZjJvcno3aTY2Y3FpeCJ9.7AtfTdy1H6N1KpasnQ4axw';
var map = new mapboxgl.Map({
container: 'map',
style: 'mapbox://styles/mapbox/streets-v11'
});

function mapEaseTo(latlong) {
  console.log(latlong);
  // Using easeTo options.
  map.easeTo({
  center: [latlong[1], latlong[0]],
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
const searchLink = document.querySelector('#search-link');
const bucketlistLink = document.querySelector('#bucketlist-link');

searchLink.addEventListener('click', () => {
  toggleActive(searchLink);
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

// Search Form
const searchInput = document.querySelector('#search-input');
const searchType = document.querySelector('#search-type');
const searchForm = document.querySelector('#search-form');

searchForm.addEventListener('submit', e => {
  e.preventDefault();
  fetchResults();
  searchForm.reset();
})

let timerID = null;
searchInput.addEventListener('keyup', () => {
  clearTimeout(timerID);
  timerID = setTimeout(() => fetchResults().then(res => console.log(res)), 500);
})

searchType.addEventListener('change', () => searchInput.value ? fetchResults() : null)

async function fetchResults(showAll) {
  if (searchInput.value) {
    const url = `https://restcountries.eu/rest/v2/${showAll === 'all' ? 'all' : searchType.value + '/' + searchInput.value}`;

    return fetch(url)
      .then(res => res.json())
      .then(json => {
        if (json.status === 404) {
          console.log(`Error: ${json.message}`);
        } else {
          return (json);
        }
      })
      .catch(err => console.log(err.message));
  }
  return 'No user input';
}

document.addEventListener('DOMContentLoaded', () => {

})