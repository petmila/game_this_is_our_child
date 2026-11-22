import {
  loadGameData,
  resetCardDecks,
  getRandomInfluenceCard,
  getRandomChoiceCard,
  getRandomSituationCard
} from "./data.js";

async function initializeGame() {
  await loadGameData();
  console.log("Игра готова");
}

initializeGame();

const startButton = document.getElementById("startButton");
const continueButton = document.getElementById("continueButton");
const nextButton = document.getElementById("nextButton");
const sliderTrack = document.getElementById("sliderTrack");
const contentArea = document.getElementById("contentArea");

/* =========================
   GAME DATA
========================= */

// const blocks = [
//   "influence",
//   "situation",
//   "choice"
// ];

const blocks = [
  "influence",
  "choice",
  "situation",
  "influence",
  "change_stat",
  "choice",
  "situation",
  "change_stat",
  "influence",
  "situation",
  "choice",
  "change_stat",
  "influence",
  "situation",
  "change_stat",
  "situation",
  "choice",
  "influence",
  "situation",
  "influence",
  "change_stat",
  "choice",
  "situation",
  "choice",
  "change_stat",
  "influence",
  "situation",
  "choice",
  "influence",
  "change_stat",
  "situation",
  "choice",
  "influence",
  "choice",
  "change_stat",
  "situation",
  "influence",
  "choice"
];

const blockTypes = {
  "influence": "Влияние среды",
  "situation": "Сделайте выбор сами",
  "choice": "Непредсказуемые последствия",
  "change_stat": "Займитесь своим ребенком"
}
const statNamesDict = {
  "И": "Интеллект",
  "ФЗ": "Физическое здоровье",
  "МС": "Ментальное состояние",
  "ОР": "Отношения с родителем",
  "В": "Воспитанность"
}

let stats = {
  "И": 0,
  "ФЗ": 0,
  "МС": 0,
  "ОР": 0,
  "В": 0
}

let currentIndex = 0;
let initialStats = {};

/* =========================
   AUDIO
========================= */

const bgMusic = new Audio(new URL("../audio/background.mp3", import.meta.url).href);
bgMusic.loop = true;
bgMusic.volume = 0.1;
const coinSound = new Audio(new URL("../audio/coin.mp3", import.meta.url).href);
coinSound.volume = 0.9;
const victorySound = new Audio(new URL("../audio/victory.mp3", import.meta.url).href);
victorySound.volume = 0.7;

let soundEnabled = true;
let musicStarted = false;

function startMusic() {
  musicStarted = true;
  if (!soundEnabled) return;
  bgMusic.play().catch(error => {
    console.warn("Не удалось запустить музыку:", error);
  });
}

// Воспроизведение эффекта
function playSound(sound) {
  if (!soundEnabled) return;
  sound.currentTime = 0;
  sound.play().catch(error => {
    console.warn("Не удалось воспроизвести звук:", error);
  });
}

/* =========================
   SCREEN SWITCHING
========================= */

function showScreen(screenId) {
  const screens = document.querySelectorAll(".screen");
  screens.forEach(screen => {
    screen.classList.add("hidden");
  });

  const activeScreen = document.getElementById(screenId);
  activeScreen.classList.remove("hidden");
}


/* =========================
   START GAME
========================= */

startButton.addEventListener(
  "click",
  pickStats
);

continueButton.addEventListener(
  "click",
  startGame
);

function randomizeStats() {
  const minStat = 2;
  const maxStat = 8;
  const totalPoints = 20;

  const statNames = [
    "И", "ФЗ", "МС", "ОР", "В"
  ];
  statNames.forEach(stat => {
    stats[stat] = minStat;
  });

  let pointsLeft = totalPoints - minStat * statNames.length;
  while (pointsLeft > 0) {
    const randomStat = statNames[Math.floor(Math.random() * statNames.length)];

    if (stats[randomStat] < maxStat) {
      stats[randomStat]++;
      pointsLeft--;
    }
  }
  return stats;
}

function showStats() {
  document.getElementById("statIntelligence").textContent = stats["И"];
  document.getElementById("statPhysical").textContent = stats["ФЗ"];
  document.getElementById("statMental").textContent = stats["МС"];
  document.getElementById("statRelationship").textContent = stats["ОР"];
  document.getElementById("statBehavior").textContent = stats["В"];
}

function generateFileNumber() {
  return String(Math.floor(Math.random() * 1000))
    .padStart(3, "0");
}

function pickStats() {
  startMusic();

  stats = randomizeStats();
  initialStats = { ...stats };
  const fileNumber = generateFileNumber();
  document.querySelectorAll(".file-number")
    .forEach(element => {
      element.textContent = fileNumber;
    });
  showStats();
  showScreen("pickStatsScreen");
}

function startGame() {
  currentIndex = 0;
  resetCardDecks();
  showScreen("gameScreen");
  createSlider();
  updateGame();
}


/* =========================
   CREATE SLIDER
========================= */

function createSlider() {
  sliderTrack.innerHTML = "";
  blocks.forEach((type, index) => {
    const block = document.createElement("div");
    block.classList.add(
      "game-block",
      `game-block--${type}`
    );

    block.dataset.index = index;
    block.dataset.type = type;

    block.textContent = blockTypes[type];
    sliderTrack.appendChild(block);
  });

}


function updateGame() {
  updateBlockClasses();
  moveSliderToCurrent();
  updateProgressBar();
  updateContentPanel();
}


/* =========================
   UPDATE BLOCK STATES
========================= */
function updateProgressBar() {
  const progressFill =
    document.getElementById("progressFill");
  if (!progressFill) {
    return;
  }
  const progress =
    blocks.length <= 1
      ? 100
      : (currentIndex / (blocks.length - 1)) * 100;

  progressFill.style.width = `${progress}%`;
}

function updateBlockClasses() {

  const allBlocks =
    document.querySelectorAll(
      ".game-block"
    );

  allBlocks.forEach(
    (block, index) => {
      block.classList.remove(
        "current",
        "previous",
        "next",
        "inactive"
      );

      if (index === currentIndex) {
        block.classList.add(
          "current"
        );
      }

      else if (
        index === currentIndex - 1
      ) {
        block.classList.add(
          "previous"
        );
      }
      else if (
        index === currentIndex + 1
      ) {
        block.classList.add(
          "next"
        );
      }
      else {
        block.classList.add(
          "inactive"
        );
      }
    }
  );

}


/* =========================
   MOVE SLIDER
========================= */

function moveSliderToCurrent() {
  const allBlocks =
    document.querySelectorAll(
      ".game-block"
    );

  const currentBlock =
    allBlocks[currentIndex];
  if (!currentBlock) {
    return;
  }

  const viewport =
    document.querySelector(
      ".slider-viewport"
    );

  /*
    Центр viewport
  */

  const viewportCenter =
    viewport.clientHeight / 2;

  /*
    Центр текущего блока
    внутри sliderTrack
  */

  const blockCenter =
    currentBlock.offsetTop +
    currentBlock.offsetHeight / 2;

  /*
    Насколько нужно
    передвинуть track,
    чтобы текущий блок
    оказался по центру
  */

  const offset =
    viewportCenter -
    blockCenter;

  sliderTrack.style.transform =
    `translate(-50%, ${offset}px)`;

}


/* =========================
   RIGHT CONTENT
========================= */

function updateContentPanel() {

  const currentType = blocks[currentIndex];
  if (currentType === "change_stat") {
    renderChangeStat();
    return;
  }
  else if (currentType === "influence") {
    renderInfluence();
    return;
  }
  else if (currentType === "choice") {
    renderChoice();
    return;
  }
  else if (currentType === "situation") {
    renderSituation();
    return;
  }
}

function renderSituation() {
  const card = getRandomSituationCard();
  nextButton.disabled = true;

  const choicesHtml = card.choices
    .map((choice, index) => `
      <button
        class="situation-choice-button"
        data-choice-index="${index}">
        ${choice.text}
      </button>
    `)
    .join("");

  contentArea.innerHTML = `
    <div class="situation-content">
      <div class="situation-sheet">
        <p class="situation-description">
          ${card.description}
        </p>
        <div class="situation-choices">
          ${choicesHtml}
        </div>
        <div id="situationResult"
          class="situation-result hidden">
        </div>
        <div id="guardiansSituationComment"
          class="guardians-comment hidden">
        </div>
      </div>
    </div>
  `;

  const buttons =
    document.querySelectorAll(".situation-choice-button");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const choiceIndex =
        Number(button.dataset.choiceIndex);
      resolveSituationChoice(
        card,
        choiceIndex
      );
    });
  });
  updateContentScale();
}

function resolveSituationChoice(card, choiceIndex) {
  const choice = card.choices[choiceIndex];
  if (!choice) {
    return;
  }
  applyEffects(choice.effects);

  const buttons = document.querySelectorAll(".situation-choice-button");
  buttons.forEach(button => {
    button.disabled = true;
  });

  const selectedButton =
    document.querySelector(
      `.situation-choice-button[data-choice-index="${choiceIndex}"]`
    );
  selectedButton.classList.add("selected");
  const resultBlock = document.getElementById("situationResult");
  const commentBlock = document.getElementById("guardiansSituationComment");
  resultBlock.innerHTML = `
    <h3>Последствия</h3>
    <ul>
      ${renderEffects(choice.effects)}
    </ul>
  `;
  commentBlock.textContent = choice.comment;
  resultBlock.classList.remove("hidden");
  commentBlock.classList.remove("hidden");
  nextButton.disabled = false;
  updateContentScale();
}

function renderChoice() {
  const card = getRandomChoiceCard();
  nextButton.disabled = true;
  contentArea.innerHTML = `
    <div class="choice-content">
      <div class="choice-sheet">
        <p class="choice-description">
          ${card.description}
        </p>
        <button id="coinButton" class="coin-button">Подбросить</button>
        <div id="choiceResult" class="choice-result hidden"></div>
        <div id="guardiansChoiceComment"
          class="guardians-comment hidden">
        </div>
      </div>
    </div>
  `;
  const coinButton = document.getElementById("coinButton");
  coinButton.addEventListener(
    "click",
    () => resolveChoice(card)
  );
  updateContentScale();
}

function resolveChoice(card) {
  const coinButton = document.getElementById("coinButton");
  const resultBlock = document.getElementById("choiceResult");
  const commentBlock = document.getElementById("guardiansChoiceComment");
  coinButton.disabled = true;
  coinButton.classList.add("flipping");
  playSound(coinSound);
  setTimeout(() => {
    const isSuccess = Math.random() < 0.5;
    const outcome = isSuccess ? card.success : card.failure;
    applyEffects(outcome.effects);
    coinButton.textContent = isSuccess ? "УДАЧА": "НЕУДАЧА";
    coinButton.classList.remove("flipping");
    coinButton.classList.add(isSuccess ? "success": "failure");
    resultBlock.innerHTML = `
      <ul>
        ${renderEffects(outcome.effects)}
      </ul>
    `;
    commentBlock.textContent = outcome.comment;
    resultBlock.classList.remove("hidden");
    commentBlock.classList.remove("hidden");
    nextButton.disabled = false;
  }, 900);
  updateContentScale();
}

function applyEffects(effects) {
  effects.forEach(effect => {
    switch (effect.stat) {
      case "И":
        stats["И"] += effect.value;
        break;

      case "ФЗ":
        stats["ФЗ"] += effect.value;
        break;

      case "МЗ":
      case "МС":
        stats["МС"] += effect.value;
        break;

      case "ОР":
      case "ОСР":
        stats["ОР"] += effect.value;
        break;

      case "В":
        stats["В"] += effect.value;
        break;
    }

  });
}

function renderEffects(effects) {
  return effects
    .map(effect => `
      <li>
        ${statNamesDict[effect.stat]}:
        ${effect.value > 0 ? "+" : ""}
        ${effect.value}
      </li>
    `)
    .join("");
}

function renderInfluence() {
  const card = getRandomInfluenceCard();
  const effectsHtml = renderEffects(card.effects);
  applyEffects(card.effects);
  // card.effects.forEach(effect => {
  //   stats[effect.stat] += effect.value;
  // }); 

  contentArea.innerHTML = `
    <div class="influence-content">
      <div class="influence-sheet">
        <p class="influence-description">
          ${card.description}
        </p>
        <div class="influence-effects">
          <h3>Последствия</h3>
          <ul>
            ${effectsHtml}
          </ul>
        </div>
        <div class="guardians-comment">
          ${card.comment}
        </div>
      </div>
    </div>
  `;
  nextButton.disabled = false;
  updateContentScale();
}

function renderChangeStat() {
  nextButton.disabled = true;
  contentArea.innerHTML = `
    <div class="change-stat-content">
    <div class="change-stat-sheet">
      <p class="change-stat-text">
        Выберите характеристику, на которую хотите положительно повлиять:
      </p>
      <div class="change-stat-options">
        <button class="stat-choice-button" data-stat="И">Интеллект</button>
        <button class="stat-choice-button" data-stat="ФЗ">Физическое здоровье</button>
        <button class="stat-choice-button" data-stat="МС">Ментальное состояние</button>
        <button class="stat-choice-button" data-stat="ОР">Отношения с родителями</button>
        <button class="stat-choice-button" data-stat="В">Воспитанность</button>
      </div>
      <p id="changeStatResult" class="change-stat-result"></p>
      </div>
    </div>
  `;
  setupChangeStatButtons();
  updateContentScale();
}

const statMessages = {
  "И":
    "Вы решили уделить больше внимания развитию и обучению ребёнка. +2 к Интеллекту",
  "ФЗ":
    "Вы наконец отвели ребенка на плановый осмотр в поликлинику. +2 к Физическому здоровью",
  "МС":
    "Вы отвели ребенка к психологу. Давно пора! +2 к Ментальному состоянию",
  "ОР":
    "Ваш ребенок явно нуждался в качественном совместном досуге. +2 к Отношениям с вами",
  "В":
    "Вы уделили внимание воспитанию своего ребенка. +2 к Воспитанности"
};

function setupChangeStatButtons() {
  const buttons =
    document.querySelectorAll(".stat-choice-button");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const selectedStat = button.dataset.stat;
      applyStatRecovery(selectedStat);
    });
  });
}

function applyStatRecovery(statName) {
  stats[statName] += 2;
  const buttons =
    document.querySelectorAll(".stat-choice-button");
  buttons.forEach(button => {
    button.disabled = true;
  });
  const selectedButton =
    document.querySelector(
      `.stat-choice-button[data-stat="${statName}"]`
    );
  selectedButton.classList.add("selected");
  const result = document.getElementById("changeStatResult");

  result.textContent = statMessages[statName];
  nextButton.disabled = false;
}
/* =========================
   NEXT BUTTON
========================= */

nextButton.addEventListener(
  "click",
  goToNextBlock
);


function goToNextBlock() {

  currentIndex++;
  /*
    Если блоки закончились —
    показываем финальный экран
  */

  if (
    currentIndex >= blocks.length
  ) {
    showResult();
    return;
  }


  updateGame();

}

function fitContentToViewport() {
  const viewport = document.querySelector(".content-viewport");
  const content = document.getElementById("contentArea");
  if (!viewport || !content) {
    return;
  }
  content.style.transform = "scale(1)";
  const availableWidth = viewport.clientWidth;
  const availableHeight = viewport.clientHeight;


  const contentWidth = content.scrollWidth;
  const contentHeight = content.scrollHeight;

  const scaleX = availableWidth / contentWidth;
  const scaleY = availableHeight / contentHeight;

  const scale =
    Math.min(
      1,
      scaleX,
      scaleY
    );

  content.style.transform =
    `scale(${scale})`;
}

function updateContentScale() {
  requestAnimationFrame(() => {
    fitContentToViewport();
  });
}

window.addEventListener(
  "resize",
  updateContentScale
);
/* =========================
   RESULT
========================= */

const endings = {
  negativeSingle: {
    "МС": "Вы так старались вырастить идеального человека, что забыли уточнить, как он себя при этом чувствует. Мы забираем ребенка в специализированный санаторий. Не волнуйтесь, там он сможет совмещать свою обычную жизнь с курсом седативных. Мы понимаем, что вы действовали из луших побуждений, но лучше вашему ребенку не видеть вас ближайшие полгода, как минимум.",
    "ФЗ": "Терапевт едва не перекрестился, когда понял, что у вашего ребенка цинга. В двадцать первом веке! Мы однозначно забираем его в лучшее место, пока вы не решились пройти по всем средневековым болезням и не заразили его чумой. И нет, к ребенку вас не пустят!",
    "ОР": "Поздравляем, вы создали идеального человека, который вас искренне ненавидит. Вы вложили в него все ресурсы: деньги, время и силы, но забыли главное — тепло. Мы не будем вас осуждать, мы просто вычеркнем вас из его свидетельства о рождении",
    "И": "Мы вынуждены признать: ваш ребенок — это невероятно счастливый и воспитанный человек с нулевыми шансами на выживание в реальном мире. Мы вручаем ему медаль за доброту и отправляем в специнтернат, где его попытаются адаптировать к нормальной жизни. Вам с ним нельзя! По крайней мере, вы всегда можете успокоить себя тем, что он точно никогда не станет злым гением",
    "В": "Ребенок вроде здоров и умен, но прямо сейчас пытается продать соседского кота на маркетплейсе. К сожалению, мы вынуждены изолировать его от общества и поместить в исправительное учреждение на какое-то время."
  },
  negativeMultiple: "Ребенок сбежал из дома, а вы спохватились спустя целых два дня?! Давать вам шанс было нашей величайшей ошибкой! Мы немедленно обратимся в полицию и привлечем к поискам волонтеров! Но будьте уверены, в случае его обнаружения ВЫ этого ребенка больше никогда не увидите!",
  positive: "Признавать свои ошибки нелегко, но в данном случае мы счастливы, что ошибались на ваш счет. Из вас получился если не эталонный, то однозначно хорошо справляющийся со своими обязанностями родитель. Мы снимаем вашу семью с учета и перестаем вести за ней контроль. Удачи в будущем! Перед вами все еще стоит задача не стать в ближайшее время счастливыми бабушкой и дедушкой."
}

function getEnding() {
  // Собираем названия всех отрицательных статов
  const negativeStats = Object.keys(stats)
    .filter(stat => stats[stat] <= 0);
  // Если отрицательных два или больше
  if (negativeStats.length >= 2) {
    return endings.negativeMultiple;
  }
  // Если отрицательная только одна характеристика
  if (negativeStats.length === 1) {
    const statName = negativeStats[0];
    return endings.negativeSingle[statName];
  }
  // Если отрицательных характеристик нет
  return endings.positive;
}

function renderEnding() {
  const endingText = document.getElementById("endingText");
  const ending = getEnding();
  endingText.innerHTML = "";
  const paragraphs = ending.trim().split(/\n\s*\n/);
  paragraphs.forEach(text => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text.trim();
    endingText.appendChild(paragraph);
  });
}

function showResult() {
  document.getElementById("statIntelligenceFinal").textContent = stats["И"];
  document.getElementById("statPhysicalFinal").textContent = stats["ФЗ"];
  document.getElementById("statMentalFinal").textContent = stats["МС"];
  document.getElementById("statRelationshipFinal").textContent = stats["ОР"];
  document.getElementById("statBehaviorFinal").textContent = stats["В"];

  document.getElementById("statIntelligenceInitial").textContent = initialStats["И"];
  document.getElementById("statPhysicalInitial").textContent = initialStats["ФЗ"];
  document.getElementById("statMentalInitial").textContent = initialStats["МС"];
  document.getElementById("statRelationshipInitial").textContent = initialStats["ОР"];
  document.getElementById("statBehaviorInitial").textContent = initialStats["В"];

  renderEnding();

  document.querySelectorAll(".final-stats .personal-file__row span:last-child")
  .forEach(element => {
    const value = Number(element.textContent);
    element.classList.toggle("negative-stat", value <= 0);
  });

  const isGoodEnding = Object.values(stats).every(value => value > 0);
  if (isGoodEnding) {
    playSound(victorySound);
  }
  showScreen("resultScreen");

}