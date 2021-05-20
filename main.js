const baseUrl = 'https://api.scryfall.com/cards'

const searchResultsElement = document.getElementById('search-results');

function clearSearchResults() {
  searchResultsElement.innerHTML = '';
}

class Modal {
  constructor(htmlElement) {
    this.htmlElement = htmlElement;
    this.img = htmlElement.querySelector('img');
    this.backdrop = htmlElement.querySelector('#backdrop');
    this.backdrop.addEventListener('click', this.hide.bind(this));
  }

  hide() {
    this.htmlElement.classList.remove('visible');
  }

  show(newImageSource) {
    this.img.onload = () => {
      this.htmlElement.classList.add('visible');
    }
    this.img.src = newImageSource;
  }
}

class Card {
  constructor(data, options) {
    const { image_uris, name } = data;
    this.name = name;
    if (!image_uris) return;

    if (options) {
      this.handlers = options.handlers;
    }

    this.images = [image_uris.small, image_uris.png];
  }

  handleLeftClick() {
    this.handlers.leftClick(this);
  }

  render() {
    if (!this.images) {
      return document.createTextNode('');
    }

    const listElement = document.createElement('li');
    listElement.className = 'card';
    listElement.innerHTML = `<img src=${this.images[0]} alt="${this.name}" />`;
    listElement.addEventListener('click', this.handleLeftClick.bind(this));
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

const searchFieldElement = document.getElementById('search-field');

const modal = new Modal(document.getElementById('modal'));

function enlargeCard(card) {
  modal.show(card.images[1]);
}

document.getElementById('build-options').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!searchFieldElement.value) return;

  clearSearchResults();
  const searchTerm = searchFieldElement.value;

  getAPIResults(searchTerm)
  .then((apiList) => {
    apiList.forEach((cardData) => {
      const newCard = new Card(cardData, { handlers: {leftClick: enlargeCard} });
      searchResultsElement.appendChild(newCard.render());
    });
  });
});
