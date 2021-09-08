// MAPBOX
mapboxgl.accessToken = 'pk.eyJ1Ijoid2lsZnJlZGJheXVkYW4iLCJhIjoiY2t0NDFyMGR2MG04ZjJvcno3aTY2Y3FpeCJ9.7AtfTdy1H6N1KpasnQ4axw';
var map = new mapboxgl.Map({
container: 'map',
zoom: 1,
center: [39, 34],
style: 'mapbox://styles/mapbox/streets-v11'
});

function mapEaseTo(latlng) {
  console.log(latlng);
  if (typeof latlng === 'object') {
    // USA LATLONG
    if (latlng.length === 0) {
      latlng = [39.50, -98.35];
    }
    map.easeTo({
      center: [latlng[1], latlng[0]],
      zoom: 4,
      speed: 0.3,
      curve: 1,
      duration: 1000,
      easing(t) {
      return t;
      }
      });
  }
}
// Selectors and intial values

const body = document.querySelector('body');
const app = document.querySelector('#app');
const searchLink = document.querySelector('#search-link');
const bucketlistLink = document.querySelector('#bucketlist-link');
const searchPage = document.querySelector('#search-page');
const bucketlistPage = document.querySelector('#bucketlist-page');
const nav = document.querySelector('nav');
const searchSelect = document.querySelector('#search-select');
const searchInput = document.querySelector('#search-input');
const searchType = document.querySelector('#search-type');
const searchForm = document.querySelector('#search-form');
const showAll = document.querySelector('#all-btn');
const resultsContainer = document.querySelector('#results-container');

let searchResults = [];
let currentPage = searchPage;
let currentLink = searchLink;

// Nav
searchLink.addEventListener('click', () => {
  showPage(searchPage, searchLink);
})
bucketlistLink.addEventListener('click', () => {
  showPage(bucketlistPage, bucketlistLink);
})

function showPage(pageElem, link) {
  nav.querySelectorAll('a').forEach(link => link.classList.remove('active'));
  if (pageElem.style.display !== 'none' && app.classList.contains('active')) {
    toggleAppDisplay();
  } else {
    app.querySelectorAll('section').forEach(page => page.style.display = 'none');
    pageElem.style.display = 'block';
    link.classList.add('active');
    if (!app.classList.contains('active')) {
      toggleAppDisplay();
      link.classList.add('active');
    }
  }
  currentPage = pageElem;
  currentLink = link;
}

// Events
app.addEventListener('click', () => {
  if (app.className !== 'active') {
    showPage(currentPage, currentLink);
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

showAll.addEventListener('click', () => {
  fetchResults(true).then(res => renderResults(res));
  searchForm.reset();
});

searchForm.addEventListener('submit', e => {
  e.preventDefault();
  clearTimeout(timerID);
  fetchResults()
    .then(res => {
      if (res) {
        renderResults(res);
        mapEaseTo(res[0].latlng);
      }
    })
    .catch(err => console.log(err));
  searchForm.reset();
})

let timerID = null;
searchInput.addEventListener('keyup', () => {
  if (searchInput.value) {
    clearTimeout(timerID);
    timerID = setTimeout(() => fetchResults().then(res => renderResults(res)), 500);
  }
})

searchSelect.addEventListener('change', () => {
  if (searchSelect.value) {
    console.log(searchSelect.value);
    fetchResults()
      .then(res => renderResults(res))
      .catch(err => console.log(err));
  }
})

searchType.addEventListener('change', () => {
  if (searchType.value === "region") {
    searchSelect.style.display = 'block';
    searchInput.style.display = 'none';
  } else {
    searchSelect.style.display = 'none';
    searchInput.style.display = 'block';
  }
})

// API

async function fetchResults(showAll) {
  if (searchInput.value || showAll === true || searchSelect.value) {
    const searchValue = searchType.value === 'region' ? searchSelect.value : searchInput.value;
    const url = `https://restcountries.eu/rest/v2/${showAll === true ? 'all' : searchType.value + '/' + searchValue}`;

    return fetch(url)
      .then(res => res.json())
      .then(json => {
        if (json.status === 404) {
          showModal('Oops!', `We couldn't find any countries with that name.`)
        } else {
          searchResults = json;
          return (json);
        }
      })
      .catch(err => console.log(err.message));
  }
  return 'No user input';
}

// Render 
function renderModal() {
  const div = document.createElement('div');
  const h3 = document.createElement('h3');
  const p = document.createElement('p');
  div.id = 'modal';
  div.appendChild(h3);
  div.appendChild(p);
  body.appendChild(div);
}

function showModal(heading = 'Oops!', message = 'Something went wrong.', type = 'info') {
  const modal = document.querySelector('#modal');
  const h3 = document.querySelector('#modal h3');
  const p = document.querySelector('#modal p');
  h3.className = type;
  h3.textContent = heading;
  p.textContent = message;
  modal.className = 'active';
  setTimeout(() => modal.className = '', 2500)
}

function renderResults(res) {
  if (typeof res === 'object') {
    resultsContainer.textContent = '';
    const ul = document.createElement('ul');
    res.forEach(country => {
      const li = document.createElement('li');
      const img = document.createElement('img');
      img.src = country.flag;
      img.alt = country.cioc;
      img.width = 60;
      li.appendChild(img);
      const infoDiv = document.createElement('div');
      infoDiv.className = 'country-info';
      const h4 = document.createElement('h4');
      h4.textContent = country.name;
      const p = document.createElement('p');
      p.textContent = country.subregion;
      infoDiv.appendChild(h4);
      infoDiv.appendChild(p);
      li.appendChild(infoDiv);
      const countryOptions = document.createElement('div');
      countryOptions.className = 'country-options';
      const toBucketlistBtn = document.createElement('button');
      toBucketlistBtn.className = 'green-btn';
      toBucketlistBtn.textContent = '+ADD';
      toBucketlistBtn.addEventListener('click', e => {
        e.stopPropagation();
        console.log(`Clicked ${country.cioc}`)
      })
      countryOptions.appendChild(toBucketlistBtn);
      li.appendChild(countryOptions);
      ul.appendChild(li);
      li.addEventListener('click', () => mapEaseTo(country.latlng));
    })
    resultsContainer.appendChild(ul);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Initial Modal Render
  renderModal();


})