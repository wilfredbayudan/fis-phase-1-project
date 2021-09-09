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
    <p><b>Capital:</b> ${country.capital}</p>
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
const sortSelect = document.querySelector('#sort-type');

let searchResults = [];
let userBucketlist = [];
let currentLink = searchLink;
let currentPage = searchContainer;
let currentFilter = null;

// Nav
searchLink.addEventListener('click', () => {
  showPage(searchContainer, searchLink);
  resultsContainer.style.display = 'block';
  bucketlistHeader.style.display = 'none';
  bucketlistContainer.style.display = 'none';
  renderResults(searchResults);
})
bucketlistLink.addEventListener('click', () => {
  showPage(bucketlistHeader, bucketlistLink);
  bucketlistContainer.style.display = 'block';
  searchContainer.style.display = 'none';
  resultsContainer.style.display = 'none';
  renderResults(userBucketlist, bucketlistContainer, true)
})

function showPage(pageElem = searchContainer, link = searchLink) {
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

sortSelect.addEventListener('change', () => {
  currentFilter = sortSelect.value;
  renderResults(userBucketlist, bucketlistContainer, true)
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

// More Mapstuff
function geoJson(bucketlist) {
  return {
    type: 'Feature Collection',
    features: bucketlist.map(country => {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: country.lnglat
        },
        properties: {
          title: country._data.name,
          description: country._data.subregion
        }
      }
    })
  }
}

function renderMarkers(geojson) {
  document.querySelectorAll('.marker').forEach(marker => marker.remove());
  // add markers to map
  for (const { geometry, properties } of geojson.features) {
    // create a HTML element for each feature
    const el = document.createElement('div');
    el.className = 'marker';

    // make a marker for each feature and add to the map
    new mapboxgl.Marker(el).setLngLat(geometry.coordinates).addTo(map);
  }
}

// Bucketlist
class BucketlistCountry {
  constructor(id, data) {
    this._id = id;
    this._data = data;
    this._rating = 0;
    this._notes = '';
    this._added = Date.now();
  }

  get lnglat() {
    return [this._data.latlng[1], this._data.latlng[0]];
  }

  get rating() {
    return this._rating;
  }

  get notes() {
    return this._notes;
  }

  setNote(newNotes) {
    this._notes = newNotes.trim();
  }

  setRating(newRating) {
    this._rating = newRating;
  }
  
}

class Bucketlist {
  static find = countryCode => {
    return userBucketlist.find(bucketlistCountry => bucketlistCountry._id === countryCode)
  }

  static add = country => {
    if (!this.find(country.alpha3Code)) {
      console.log(`Adding ${country.alpha3Code} to Bucketlist`);
      const Country = new BucketlistCountry(country.alpha3Code, country);
      userBucketlist.push(Country);
      this.refreshCount();
      renderMarkers(geoJson(userBucketlist));
      return Country;
    } else {
      console.log('Already in the bucketlist, oops.')
    }
  }

  static remove = countryCode => {
    if (this.find(countryCode)) {
      let res = [];
      res = userBucketlist.filter(country => country._id !== countryCode);
      userBucketlist = res;
      this.refreshCount();
      renderMarkers(geoJson(userBucketlist));
      return res;
    }
  }

  static refreshCount() {
    const bucketlistSize = userBucketlist.length;
    const countCountainer = document.querySelector('#bucket-count');
    countCountainer.textContent = bucketlistSize;
    countCountainer.className = 'active';
    setTimeout(() => countCountainer.className = '', 300)
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
    setTimeout(() => document.querySelector('#loader').remove(), 150);
  }
}

function renderModal(id) {
  const div = document.createElement('div');
  const h3 = document.createElement('h3');
  const p = document.createElement('p');
  div.id = id;
  div.appendChild(h3);
  div.appendChild(p);
  body.appendChild(div);
}

let modalTimer = null;
function showModal(heading = 'Oops!', message = 'Something went wrong.', type = 'info') {
  killLoader();
  clearTimeout(modalTimer); 
  const modal = document.querySelector('#modal');
  const h3 = document.querySelector('#modal h3');
  const p = document.querySelector('#modal p');
  h3.className = type;
  h3.textContent = heading;
  p.textContent = message;
  modal.className = 'active';
  modalTimer = setTimeout(() => modal.className = '', 2500)
}

function renderRating(countryCode) {
  const country = Bucketlist.find(countryCode);
  const maxRating = 5;
  const ratingContainer = document.createElement('div');
  for (let i = 1; i <= maxRating; i++) {
    const star = document.createElement('span');
    star.classList.add('fa','fa-star');
    if (i <= country.rating) {
      star.classList.add('checked');
    }
    star.addEventListener('click', () => {
      country.setRating(i);
      renderResults(userBucketlist, bucketlistContainer, true)
    })
    ratingContainer.appendChild(star);
  }
  return ratingContainer;
}

function renderNoteForm(countryCode) {
  const bucketlistDetails = Bucketlist.find(countryCode);
  const form = document.createElement('form');
  form.className = 'note-form';
  form.id = `note-${countryCode}`;
  const input = document.createElement('input');
  input.setAttribute('type','text');
  input.value = bucketlistDetails.notes;
  form.appendChild(input);
  form.addEventListener('submit', e => {
    e.preventDefault();
    console.log(`Submitted at ${countryCode}`);
    bucketlistDetails.setNote(input.value);
    renderResults(userBucketlist, bucketlistContainer, true)
  })
  return form;
}

function renderBucketlistDetails(countryCode) {
  const bucketlistDetails = Bucketlist.find(countryCode);
  if (bucketlistDetails) {
    const divContainer = document.createElement('div');
    divContainer.className = 'bucketlist-details';
    divContainer.appendChild(renderRating(countryCode));
    const span = document.createElement('span');
    span.className = 'added';
    span.textContent = `Added ${timeAgo(bucketlistDetails._added)}`;
    const divNotes = document.createElement('div');
    divNotes.className = 'notes';
    divNotes.textContent = bucketlistDetails.notes;
    if (bucketlistDetails.notes === '') {
      const span = document.createElement('span');
      span.className = 'faded';
      span.textContent = 'Add a note';
      divNotes.appendChild(span);
    }
    divNotes.addEventListener('click', () => {
      divNotes.style.display = 'none';
      document.querySelector(`#note-${countryCode}`).style.display = 'block';
      document.querySelector(`#note-${countryCode} input`).focus();
    })
    divContainer.appendChild(divNotes);
    divContainer.appendChild(renderNoteForm(countryCode));
    divContainer.appendChild(span);
    return divContainer;
  }
}

function sortBucketlist(data, method) {
  switch(method) {
    case 'alpha':
      return data.sort((a, b) => {
        let nameA = a._data.name.toLowerCase();
        let nameB = b._data.name.toLowerCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
      })

    case 'alphaRev':
      return data.sort((a, b) => {
        let nameA = a._data.name.toLowerCase();
        let nameB = b._data.name.toLowerCase();
        if (nameA < nameB) {
          return 1;
        }
        if (nameA > nameB) {
          return -1;
        }
      })

    case 'ratingLow':
      return data.sort((a, b) => a._rating - b._rating)

    case 'ratingHigh':
      return data.sort((a, b) => b._rating - a._rating)

    case 'newest':
      return data.sort((a, b) => b._added - a._added)

    case 'oldest':
      return data.sort((a, b) => a._added - b._added)

    default:
      return data;
  }
}

function renderResults(data, destination = resultsContainer, isBucketlist = false) {
  if (typeof data === 'object') {
    if (data.length === 0) {
      const span = document.createElement('span');
      span.className = 'faded-margintop';
      span.textContent = 'Nothing to see here... Search for countries and add them to your bucketlist to get started!';
      destination.textContent = '';
      destination.appendChild(span);
    } else {

      const res = isBucketlist ? sortBucketlist(data, currentFilter).map(country => country._data) : data;
      destination.textContent = '';
      const ul = document.createElement('ul');
      res.forEach(country => {
        const li = document.createElement('li');
        const overviewDiv = document.createElement('div');
        overviewDiv.className = 'country-overview';
        const img = document.createElement('img');
        img.src = country.flag;
        img.alt = country.cioc;
        img.width = 60;
        overviewDiv.appendChild(img);
        const infoDiv = document.createElement('div');
        infoDiv.className = 'country-info';
        const h4 = document.createElement('h4');
        h4.textContent = country.name;
        const p = document.createElement('p');
        p.textContent = country.region;
        infoDiv.appendChild(h4);
        infoDiv.appendChild(p);
        overviewDiv.appendChild(infoDiv);
        const countryOptions = document.createElement('div');
        countryOptions.className = 'country-options';
        countryOptions.appendChild(renderBucketButton(country, destination, isBucketlist));
        overviewDiv.appendChild(countryOptions);
        li.appendChild(overviewDiv);
        if (isBucketlist) {
          li.appendChild(renderBucketlistDetails(country.alpha3Code));
        }
        ul.appendChild(li);
        overviewDiv.addEventListener('click', () => {
          mapTo(country);
        });
      })
      destination.appendChild(ul);

    }
  }
}

function renderBucketButton(country, destination, isBucketlist = false) {
  const res = Bucketlist.find(country.alpha3Code);
  const toBucketlistBtn = document.createElement('button');
  toBucketlistBtn.className = res ? 'red-btn' : 'green-btn';
  toBucketlistBtn.textContent = res ? 'REMOVE' : '+ADD';
  toBucketlistBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (Bucketlist.find(country.alpha3Code)) {
      Bucketlist.remove(country.alpha3Code);
      e.srcElement.parentElement.parentElement.parentElement.className = isBucketlist ? 'deleting' : '';
      showModal('Success!', `${country.name} has been removed from your bucketlist.`);
    } else {
      Bucketlist.add(country)
      showModal('Success!', `${country.name} has been added to your bucketlist.`);
    }
    setTimeout(() => renderResults((isBucketlist ? userBucketlist: searchResults), destination, isBucketlist), isBucketlist ? 500 : 0)
  })
  return toBucketlistBtn;
}

// Time Ago Function
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];


function getFormattedDate(date, prefomattedDate = false, hideYear = false) {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours();
  let minutes = date.getMinutes();

  if (minutes < 10) {
    // Adding leading zero to minutes
    minutes = `0${ minutes }`;
  }

  if (prefomattedDate) {
    // Today at 10:20
    // Yesterday at 10:20
    return `${ prefomattedDate } at ${ hours }:${ minutes }`;
  }

  if (hideYear) {
    // 10. January at 10:20
    return `${ day }. ${ month } at ${ hours }:${ minutes }`;
  }

  // 10. January 2017. at 10:20
  return `${ day }. ${ month } ${ year }. at ${ hours }:${ minutes }`;
}


// --- Main function
function timeAgo(dateParam) {
  if (!dateParam) {
    return null;
  }

  const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
  const DAY_IN_MS = 86400000; // 24 * 60 * 60 * 1000
  const today = new Date();
  const yesterday = new Date(today - DAY_IN_MS);
  const seconds = Math.round((today - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const isToday = today.toDateString() === date.toDateString();
  const isYesterday = yesterday.toDateString() === date.toDateString();
  const isThisYear = today.getFullYear() === date.getFullYear();


  if (seconds < 5) {
    return 'just now';
  } else if (seconds < 60) {
    return `${ seconds } seconds ago`;
  } else if (seconds < 90) {
    return 'about a minute ago';
  } else if (minutes < 60) {
    return `${ minutes } minutes ago`;
  } else if (isToday) {
    return getFormattedDate(date, 'Today'); // Today at 10:20
  } else if (isYesterday) {
    return getFormattedDate(date, 'Yesterday'); // Yesterday at 10:20
  } else if (isThisYear) {
    return getFormattedDate(date, false, true); // 10. January at 10:20
  }

  return getFormattedDate(date); // 10. January 2017. at 10:20
}

document.addEventListener('DOMContentLoaded', () => {
  // Initial Modal Render
  renderModal('modal');

})