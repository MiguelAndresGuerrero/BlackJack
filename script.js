
let deckId;
let dealerScore = 0;
let playerScore = 0;
let isPlayerTurn = true;
let dealerFirstCard;
let dealerFirstCardHidden = true;

// Obtener elementos del DOM
const dealerCardsElem = document.getElementById('dealer-cards');
const playerCardsElem = document.getElementById('player-cards');
const dealerScoreElem = document.getElementById('dealer-score');
const playerScoreElem = document.getElementById('player-score');
const messageElem = document.getElementById('message');
const btnHit = document.getElementById('btn-hit');
const btnStand = document.getElementById('btn-stand');
const btnNewGame = document.getElementById('btn-new-game');

btnNewGame.addEventListener('click', startNewGame);
btnHit.addEventListener('click', drawCard);
btnStand.addEventListener('click', stand);

// Iniciar un nuevo juego
function startNewGame() {
    fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
    .then(res => res.json())
    .then(data => {
        deckId = data.deck_id;
        resetGame();
        drawCard();  // El jugador recibe su primera carta
        drawCard();  // El jugador recibe su segunda carta
        dealerDrawCard(true);  // El crupier recibe su primera carta oculta
        dealerDrawCard(false); // El crupier recibe su segunda carta visible
    })
    .catch(error => console.error('Error al iniciar el juego:', error));
}

// Reiniciar el juego
function resetGame() {
    dealerScore = 0;
    playerScore = 0;
    isPlayerTurn = true;
    dealerFirstCard = null;
    dealerFirstCardHidden = true;
    dealerCardsElem.innerHTML = '';
    playerCardsElem.innerHTML = '';
    dealerScoreElem.textContent = 'Puntuación: 0';
    playerScoreElem.textContent = 'Puntuación: 0';
    messageElem.textContent = '';
}

// Robar una carta para el jugador
function drawCard() {
    if (!isPlayerTurn) return;
    
    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`)
    .then(res => res.json())
    .then(data => {
        const card = data.cards[0];
        addCardToHand(card, playerCardsElem);
        playerScore += getCardValue(card);
        playerScoreElem.textContent = `Puntuación: ${playerScore}`;
        
        if (playerScore > 21) {
            messageElem.textContent = '¡Te pasaste de 21! Perdiste 😓';
            isPlayerTurn = false;
        }
    })
    .catch(error => console.error('Error al robar carta:', error));
}

function dealerDrawCard(isFirstCard = false) {
    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`)
    .then(res => res.json())
    .then(data => {
        const card = data.cards[0];
        
        if (isFirstCard) {
            dealerFirstCard = card;
            addCardToHand(card, dealerCardsElem, true); // Añadir la carta oculta
        } else {
            addCardToHand(card, dealerCardsElem);
            dealerScore += getCardValue(card);
            dealerScoreElem.textContent = `Puntuación: ${dealerScore}`;
        }
        
        // Verifica si el crupier se pasa de 21
        if (dealerScore > 21) {
            messageElem.textContent = '¡El BOT se pasó de 21! Ganaste 🙌';
            isPlayerTurn = false;
        } else if (dealerScore < 17 && !isFirstCard) {
            dealerDrawCard();
        } else if (!isPlayerTurn) {
            revealDealerFirstCard();
            if (dealerScore > 21 || dealerScore < playerScore) {
                messageElem.textContent = '¡Ganaste!';
            } else if (dealerScore > playerScore) {
                messageElem.textContent = '¡Perdiste! El BOT gana 😯';
            } else {
                messageElem.textContent = '¡Empate! 😫';
            }
        }
    })
    .catch(error => console.error('Error al robar carta del BOT: ', error));
}

// Plantarse (termina el turno del jugador)
function stand() {
    isPlayerTurn = false;
    dealerDrawCard();
}

// Agregar una carta a la mano
function addCardToHand(card, handElem, isHidden = false) {
    const cardImg = document.createElement('img');
    if (isHidden) {
        cardImg.src = 'https://deckofcardsapi.com/static/img/back.png';
        cardImg.dataset.hiddenCard = card.image;
    } else {
        cardImg.src = card.image;
    }
    cardImg.classList.add('card');
    handElem.appendChild(cardImg);
}

// Revelar la primera carta oculta del crupier
function revealDealerFirstCard() {
    if (dealerFirstCardHidden && dealerFirstCard) {
        const firstCardElem = dealerCardsElem.querySelector('img[data-hidden-card]');
        if (firstCardElem) {
            firstCardElem.src = dealerFirstCard.image;
            dealerScore += getCardValue(dealerFirstCard);
            dealerScoreElem.textContent = `Puntuación: ${dealerScore}`;
        }
        dealerFirstCardHidden = false;
    }
}

// Obtener el valor de una carta
function getCardValue(card) {
    const value = card.value;
    if (['KING', 'QUEEN', 'JACK'].includes(value)) {
        return 10;
    } else if (value === 'ACE') {
        return (playerScore + 11 > 21) ? 1 : 11;
    } else {
        return parseInt(value);
    }
};
