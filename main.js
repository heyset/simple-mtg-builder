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
    if (options) {
      this.handlers = options.handlers;
    }

    if (options && options.prebuilt) {
      this.name = options.prebuilt.name;
      this.id = options.prebuilt.id;
      this.images = options.prebuilt.images;
      this.isBasicLand = options.prebuilt.isBasicLand;
      return;
    }

    const { image_uris, name, id, type_line } = data;
    this.name = name;
    this.id = id;

    if (/Basic Land/.test(type_line)) {
      this.isBasicLand = true;
    }

    if (!image_uris) return;

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
    this.list = {};
  }

  getPlainList() {
    let plainText = `${this.deckTitleElement.value}\r\n\r\n`

    Object.values(this.list).forEach((cardListing) => {
      plainText += `${cardListing.count}x ${cardListing.card.name}\r\n`;
    });

    return plainText;
  }

  getDataObject() {
    const deckObject = {
      title: this.deckTitleElement.value,
      list: [],
    }
    
    Object.values(this.list).forEach((cardListing) => {
      deckObject.list.push({
        count: cardListing.count,
        cardData: {
          name: cardListing.card.name,
          id: cardListing.card.id,
          images: cardListing.card.images,
          isBasicLand: cardListing.card.isBasicLand,
        },
      });
    });
    
    return deckObject;
  }

  load(dataObject) {
    this.clear();
    this.deckTitleElement.value = dataObject.title;
    dataObject.list.forEach((card) => {
      for (let i = 0; i < card.count; i += 1) {
        const newCard = new Card(null, {
          prebuilt: card.cardData,
          handlers: {
            leftClick: enlargeCard,
            rightClick: this.addCard.bind(this),
            alternateRightClick: this.removeCard.bind(this),
          },
        });

        this.addCard(newCard);
      }
    });
  }

  renderSublist(card) {
    const { id, name } = card;
    const listElement = document.createElement('li');
    const subList = document.createElement('ul');

    const cardDescriptionElement = document.createElement('span');
    cardDescriptionElement.innerHTML = `<span class="list-count">0</span>x ${name}`;

    const countElement = cardDescriptionElement.querySelector('.list-count');

    listElement.appendChild(subList);
    listElement.appendChild(cardDescriptionElement);
    this.list[id] = { listElement, subList, count: 0, countElement, card }

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

let downloadFileUrl = null;

function downloadFile(name, textFileFormat, content) {
  let encoding = textFileFormat;

  if (textFileFormat === 'txt') {
    encoding = 'plain';
  }

  const data = new Blob([content], {type: `text/${encoding}`});
  
  if (downloadFileUrl) {
    window.URL.revokeObjectURL(downloadFileUrl);
  }

  downloadFileUrl = window.URL.createObjectURL(data);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', downloadFileUrl);
  downloadAnchor.setAttribute('download', `${name}.${textFileFormat}`);

  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

deckOptionsElement.querySelector('#save-json').addEventListener('click', () => {
  const deckObject = deck.getDataObject();
  
  downloadFile(deck.deckTitleElement.value, 'json', JSON.stringify(deckObject));
});

deckOptionsElement.querySelector('#save-text').addEventListener('click', () => {
  const textContent = deck.getPlainList();

  downloadFile(deck.deckTitleElement.value, 'txt', textContent);
});

deckOptionsElement.querySelector('#clear-deck').addEventListener('click', () => {
  deck.clear();
});

const fileUpload = deckOptionsElement.querySelector('#json-file');

deckOptionsElement.querySelector('#load-file').addEventListener('submit', (e) => {
  e.preventDefault();

  if (fileUpload.files[0].type !== 'application/json') {
    alert('O arquivo precisa ser .json!');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const deckObject = JSON.parse(event.target.result);
    deck.load(deckObject);
  }

  reader.readAsText(fileUpload.files[0]);
})

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
