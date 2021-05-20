const baseUrl = 'https://api.scryfall.com/cards'
const testId = '2036745a-09ea-476f-ace6-1d06b8502f83';

const searchResults = document.getElementById('search-results');

class Card {
  constructor(data, type) {
    const { image_uris, name } = data;
    this.name = name;
    if (!image_uris) return;

    this.images = [image_uris.small, image_uris.large];
  }

  render() {
    if (!this.images) {
      return document.createTextNode('');
    }

    const listElement = document.createElement('li');
    listElement.className = 'card';
    listElement.dataset.largerUrl = this.images[1];
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

// document.querySelector('.status-text').style.display = 'none';

// getAPIResults('color=blue')
// .then((apiList) => {
//   console.log(apiList);
//   apiList.forEach((cardData) => {
//     const newCard = new Card(cardData);
//     searchResults.appendChild(newCard.render());
//   });
// });
