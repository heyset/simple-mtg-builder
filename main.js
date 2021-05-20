const baseUrl = 'https://api.scryfall.com/cards'

const searchResultsElement = document.getElementById('search-results');

searchResultsElement.addEventListener('contextmenu', (e) => e.preventDefault());

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
  isBasicLand = false;

  renders = {
    deckList: () => {
      const element = document.createElement('li');
      element.className = 'card';
      element.innerHTML = `<img src=${this.images[0]} alt="${this.name}" />`;
      element.addEventListener('click', this.handleLeftClick.bind(this));
      element.addEventListener('contextmenu', this.handleAlternateRightClick.bind(this));
      return element;
    },
    searchResult: () => {
      const element = document.createElement('li');
      element.className = 'card';
      element.innerHTML = `<img src=${this.images[0]} alt="${this.name}" />`;
      element.addEventListener('click', this.handleLeftClick.bind(this));
      element.addEventListener('contextmenu', this.handleRightClick.bind(this));
      return element;
    },
  }

  constructor(data, options) {
    const { image_uris, name, id, type_line } = data;
    this.name = name;
    this.id = id;

    if (/Basic Land/.test(type_line)) {
      this.isBasicLand = true;
    }

    if (!image_uris) return;

    if (options) {
      this.handlers = options.handlers;
    }

    this.images = [image_uris.small, image_uris.png];
  }

  handleAlternateRightClick(e) {
    e.preventDefault();
    this.handlers.alternateRightClick(this);
  }

  handleLeftClick() {
    this.handlers.leftClick(this);
  }

  handleRightClick(e) {
    e.preventDefault();
    this.handlers.rightClick(this);
  }

  remove(type) {
    this.htmlElements[type].pop().remove();
  }

  render(type) {
    if (!this.images) {
      return document.createTextNode('');
    }

    return this.renders[type]();
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

class Deck {
  list = {};
  count = 0;

  constructor(htmlElement) {
    this.htmlElement = htmlElement;
    this.listElement = this.htmlElement.querySelector('#deck-list');
    this.countElement = this.htmlElement.querySelector('#count');
    this.deckTitleElement = this.htmlElement.querySelector('#deck-title');

    this.deckTitleElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.target.blur();
      }
    })
  }

  addCard(card) {
    const cardElement = card.render('deckList');

    if (!this.list[card.id]) {
      this.renderSublist(card);
    }

    const cardList = this.list[card.id];

    if (cardList.count === 4 && !card.isBasicLand) {
      return;
    }

    cardList.count += 1;
    this.updateCount(1);

    const row = Math.floor(cardList.count / 8.1);

    cardElement.style.zIndex = cardList.count;
    cardElement.style.order = cardList.count;
    cardElement.style.left = `${(cardList.count - row * 8) * 24}px`;
    cardElement.style.top = `${row * 12}px`;
    cardList.subList.style.height = `${204 + row * 12}px`;
    cardList.countElement.innerText = cardList.count;

    cardList.subList.appendChild(cardElement);
  }

  updateCount(delta) {
    this.count += delta;
    this.countElement.innerText = this.count;
  }

  clear() {
    this.updateCount(this.count * -1);
    this.listElement.innerHTML = '';
  }

  renderSublist({id, name}) {
    const listElement = document.createElement('li');
    const subList = document.createElement('ul');

    const cardDescriptionElement = document.createElement('span');
    cardDescriptionElement.innerHTML = `<span class="list-count">0</span>x ${name}`;

    const countElement = cardDescriptionElement.querySelector('.list-count');

    listElement.appendChild(subList);
    listElement.appendChild(cardDescriptionElement);
    this.list[id] = { listElement, subList, count: 0, countElement, name }

    this.listElement.appendChild(listElement);
  }

  removeCard(card) {
    let cardList = this.list[card.id];

    cardList.subList.lastChild.remove();
    cardList.count -= 1;
    this.updateCount(-1);
    cardList.countElement.innerText = cardList.count;

    if(!cardList.count) {
      cardList.listElement.remove();
      delete this.list[card.id];
    }
  }

  changeListStyle(style) {
    this.listElement.className = `show-${style}`;
  }
}

const deck = new Deck(document.getElementById('deck'));

const deckOptionsElement = document.getElementById('deck-options');

deckOptionsElement.querySelectorAll('#list-style input[type="radio"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    deck.changeListStyle(radio.value);
  });
});

document.getElementById('build-options').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!searchFieldElement.value) return;

  clearSearchResults();
  const searchTerm = searchFieldElement.value;

  getAPIResults(`f:modern ${searchTerm}`)
  .then((apiList) => {
    apiList.forEach((cardData) => {
      const newCard = new Card(cardData, {
        handlers: {
          leftClick: enlargeCard,
          rightClick: deck.addCard.bind(deck),
          alternateRightClick: deck.removeCard.bind(deck),
        },
      });

      searchResultsElement.appendChild(newCard.render('searchResult'));
    });
  });
});
