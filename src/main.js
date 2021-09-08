// MAPBOX
mapboxgl.accessToken = 'pk.eyJ1Ijoid2lsZnJlZGJheXVkYW4iLCJhIjoiY2t0NDFyMGR2MG04ZjJvcno3aTY2Y3FpeCJ9.7AtfTdy1H6N1KpasnQ4axw';
var map = new mapboxgl.Map({
container: 'map',
zoom: 1,
center: [39, 34],
style: 'mapbox://styles/mapbox/streets-v11'
});



function mapTo(country) {
  if (typeof country.latlng === 'object') {
    // USA LATLONG
    let lnglat = country.latlng;
    if (country.latlng.length === 0) {
      lnglat = [39.50, -98.35];
    }
    map.easeTo({
      center: [lnglat[1], lnglat[0]],
      zoom: 4,
      speed: 0.3,
      curve: 1,
      duration: 1000,
      easing(t) {
      return t;
      }
      });
 
    const popup = new mapboxgl.Popup({ closeOnClick: true })
    .setLngLat([lnglat[1], lnglat[0]])
    .setHTML(`
    <h2>${country.name}</h2>
    <h3>${country.nativeName}</h3>
    <span>${country.subregion}</span>
    <p><b>Population:</b> ${country.population}</p>
    `)
    .addTo(map);
  
  }
}
// Selectors and intial values

const body = document.querySelector('body');
const app = document.querySelector('#app');
const searchLink = document.querySelector('#search-link');
const bucketlistLink = document.querySelector('#bucketlist-link');

const searchContainer = document.querySelector('#search-container');
const bucketlistHeader = document.querySelector('#bucketlist-header');
const bucketlistContainer = document.querySelector('#bucketlist-container');

const nav = document.querySelector('nav');
const searchSelect = document.querySelector('#search-select');
const searchInput = document.querySelector('#search-input');
const searchType = document.querySelector('#search-type');
const searchForm = document.querySelector('#search-form');
const showAll = document.querySelector('#all-btn');
const resultsContainer = document.querySelector('#results-container');

let searchResults = [];
let userBucketlist = [];
let currentLink = searchLink;

// Nav
searchLink.addEventListener('click', () => {
  showPage(searchContainer, searchLink);
  resultsContainer.style.display = 'block';
  bucketlistHeader.style.display = 'none';
  bucketlistContainer.style.display = 'none';
})
bucketlistLink.addEventListener('click', () => {
  showPage(bucketlistHeader, bucketlistLink);
  bucketlistContainer.style.display = 'block';
  searchContainer.style.display = 'none';
  resultsContainer.style.display = 'none';
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
        mapTo(res[0]);
      }
    })
    .catch(err => console.log(err));
  searchInput.value = '';
  setTimeout(() => {
    searchInput.focus();
    searchInput.select();
  }, 100)
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
function isEmpty(str) {
  if (str.replace(/^\s+|\s+$/gm,'').length === 0) {
    return true;
  }
}
async function fetchResults(showAll = false) {
  let searchValue = searchType.value === 'region' ? searchSelect.value : searchInput.value.trim();
  if (searchType.value === 'name' || searchType.value === 'capital') {
    if (isEmpty(searchValue) && showAll === false) {
      showModal('Tisk Tisk', 'Are you searching for invisible countries? 🤨')
      return;
    }
  }
  if (searchInput.value || showAll === true || searchSelect.value) {
    const url = `https://restcountries.eu/rest/v2/${showAll === true ? 'all' : searchType.value + '/' + searchValue}`;

    renderLoader();
    return fetch(url)
      .then(res => res.json())
      .then(json => {
        if (json.status === 404) {
          showModal('Oops!', `We couldn't find any countries with that name.`)
        } else {
          searchResults = json;
          killLoader();
          return (json);
        }
      })
      .catch(err => showModal('Error', err.message));
  }
  return 'No user input';
}

// Bucketlist
class BucketlistCountry {
  constructor(id, data, rating, notes) {
    this.id = id;
    this.data = data;
    this.rating = rating;
    this.notes = notes;
    this.added = Date.now();
  }
}
class Bucketlist {
  static find = countryCode => {
    return userBucketlist.find(bucketlistCountry => bucketlistCountry.id === countryCode)
  }

  static add = country => {
    if (!this.find(country.alpha3Code)) {
      console.log(`Adding ${country.alpha3Code} to Bucketlist`);
      const Country = new BucketlistCountry(country.alpha3Code, country, 0, '');
      userBucketlist.push(Country);
      this.refreshCount();
      return Country;
    } else {
      console.log('Already in the bucketlist, oops.')
    }
  }

  static remove = countryCode => {
    if (this.find(countryCode)) {
      let res = [];
      res = userBucketlist.filter(country => country.id !== countryCode);
      userBucketlist = res;
      this.refreshCount();
      return res;
    }
  }

  static refreshCount() {
    const bucketlistSize = userBucketlist.length;
    document.querySelector('#bucket-count').textContent = bucketlistSize;
  }
}
// Render 
function renderLoader() {
  divLoader = document.createElement('div');
  divLoader.id = 'loader';
  divSpinner = document.createElement('div');
  divSpinner.className = 'spinner';
  divLoader.appendChild(divSpinner);
  body.appendChild(divLoader);
}

function killLoader() {
  if (document.querySelectorAll('#loader').length > 0) {
    setTimeout(() => document.querySelector('#loader').remove(), 300);
  }
}

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
  killLoader();
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
      p.textContent = country.region;
      infoDiv.appendChild(h4);
      infoDiv.appendChild(p);
      li.appendChild(infoDiv);
      const countryOptions = document.createElement('div');
      countryOptions.className = 'country-options';
      countryOptions.appendChild(renderBucketButton(country));
      li.appendChild(countryOptions);
      ul.appendChild(li);
      li.addEventListener('click', () => {
        mapTo(country);
      });
    })
    resultsContainer.appendChild(ul);
  }
}

function renderBucketButton(country) {
  const res = Bucketlist.find(country.alpha3Code);
  console.log(res);
  const toBucketlistBtn = document.createElement('button');
  toBucketlistBtn.className = res ? 'red-btn' : 'green-btn';
  toBucketlistBtn.textContent = res ? 'REMOVE' : '+ADD';
  toBucketlistBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (Bucketlist.find(country.alpha3Code)) {
      Bucketlist.remove(country.alpha3Code);
      showModal('Success!', `${country.name} has been removed from your bucketlist.`);
    } else {
      Bucketlist.add(country)
      showModal('Success!', `${country.name} has been added to your bucketlist.`);
    }
    renderResults(searchResults);
  })
  return toBucketlistBtn;
}

document.addEventListener('DOMContentLoaded', () => {
  // Initial Modal Render
  renderModal();


})