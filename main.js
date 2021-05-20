const baseUrl = 'https://api.scryfall.com/cards'

const searchResultsElement = document.getElementById('search-results');

// <li class="status-text">Your search results will appear here.</li>

class Card {
  constructor(data, options) {
    const { image_uris, name } = data;
    this.name = name;
    if (!image_uris) return;
    this.modal = options.modal;

    this.images = [image_uris.small, image_uris.png];
  }

  enlarge() {

  }

  render() {
    if (!this.images) {
      return document.createTextNode('');
    }

    const listElement = document.createElement('li');
    listElement.className = 'card';
    listElement.dataset.largepng = this.images[1];
    listElement.innerHTML = `<img src=${this.images[0]} alt="${this.name}" />`;
    this.htmlElement = listElement;
    return this.htmlElement;
  }
}

function getAPIResults(searchTerm) {
  return new Promise((resolve, reject) => {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    fetch(`${baseUrl}/search?order=cmc&q=${encodedSearchTerm}`)
      .then((response) => response.json())
      .then((jsonData) => resolve(jsonData.data))
    .catch((err) => reject(err));
  })
}

function clearSearchResults() {
  searchResultsElement.innerHTML = '';
}

const searchFieldElement = document.getElementById('search-field');

document.getElementById('build-options').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!searchFieldElement.value) return;

  clearSearchResults();
  const searchTerm = searchFieldElement.value;

  getAPIResults(searchTerm)
  .then((apiList) => {
    apiList.forEach((cardData) => {
      const newCard = new Card(cardData);
      searchResultsElement.appendChild(newCard.render());
    });
  });
})

