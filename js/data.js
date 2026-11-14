let influenceCards = [];
let choiceCards = [];
let situationCards = [];

let influenceDeck = [];
let choiceDeck = [];
let situationDeck = [];


async function loadJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(
      `Не удалось загрузить ${path}. Код: ${response.status}`
    );
  }

  return response.json();
}


function shuffleArray(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex =
      Math.floor(Math.random() * (i + 1));

    [
      shuffled[i],
      shuffled[randomIndex]
    ] = [
      shuffled[randomIndex],
      shuffled[i]
    ];
  }

  return shuffled;
}


function resetInfluenceDeck() {
  influenceDeck = shuffleArray(influenceCards);
}

function resetChoiceDeck() {
  choiceDeck = shuffleArray(choiceCards);
}

function resetSituationDeck() {
  situationDeck = shuffleArray(situationCards);
}


export async function loadGameData() {
  const [
    influence,
    choice,
    situation
  ] = await Promise.all([
    loadJson("./data/influence.json"),
    loadJson("./data/choice.json"),
    loadJson("./data/situation.json")
  ]);

  influenceCards = influence;
  choiceCards = choice;
  situationCards = situation;

  resetCardDecks();

  console.log("Карточки загружены");
}


export function resetCardDecks() {
  resetInfluenceDeck();
  resetChoiceDeck();
  resetSituationDeck();
}


export function getRandomInfluenceCard() {
  if (influenceDeck.length === 0) {
    return null;
  }

  return influenceDeck.pop();
}


export function getRandomChoiceCard() {
  if (choiceDeck.length === 0) {
    return null;
  }

  return choiceDeck.pop();
}


export function getRandomSituationCard() {
  if (situationDeck.length === 0) {
    return null;
  }

  return situationDeck.pop();
}