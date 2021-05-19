const baseUrl = 'https://api.scryfall.com/cards'
const testId = '2036745a-09ea-476f-ace6-1d06b8502f83';

const buildResults = document.getElementById('build-results');

class Card {
  constructor(data, type) {
    const { image_uris } = data;
    if (!image_uris) return;

    this.images = [image_uris.small, image_uris.large];
    this.buildElement();
  }

  buildElement() {
    const listElement = document.createElement('li');
    listElement.dataset.largerUrl = this.images[1];
    listElement.innerHTML = `<img src=${this.images[0]} />`;
    this.htmlElement = listElement;
  }
}

function getAPIResults(searchTerm) {
  return new Promise((resolve, reject) => {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    fetch(`${baseUrl}/search?order=cmc&q=${encodedSearchTerm}`)
      .then((response) => response.json())
      .then((jsonData) => resolve(jsonData.data))
    .catch((err) => resolve(err));
  })
}

getAPIResults('color=blue')
.then((apiList) => {
  console.log(apiList);
  apiList.forEach((cardData) => {
    const newCard = new Card(cardData);
    if (newCard.htmlElement) {
      buildResults.appendChild(newCard.htmlElement);
    }
  });
});
