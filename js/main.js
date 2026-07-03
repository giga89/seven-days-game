// --- MAIN.JS ---
// Gestione della Logica "One-Shot" e del Motore di Gioco

const ONE_SHOT_KEY = 'seven_days_played';

// Elementi UI
const uiContainer = document.getElementById('ui-container');
const characterCreator = document.getElementById('character-creator');
const blockScreen = document.getElementById('block-screen');
const startBtn = document.getElementById('start-btn');

// Stato del Gioco
let gameState = {
    day: 1,
    timeRemaining: 10, // Ore disponibili in un giorno
    worldHealth: 100,  // Salute del mondo
    cureProgress: 0,   // Progresso della cura
    familyBond: 50,    // Legame familiare
    player: {},
    partner: {},
    children: {}
};

let game = null;

// Controllo iniziale
function checkGameAccess() {
    const hasPlayed = localStorage.getItem(ONE_SHOT_KEY);
    
    if (hasPlayed) {
        // L'utente ha già giocato
        uiContainer.classList.remove('hidden');
        characterCreator.classList.add('hidden');
        blockScreen.classList.remove('hidden');
    } else {
        // Nuovo giocatore
        uiContainer.classList.remove('hidden');
        characterCreator.classList.remove('hidden');
        blockScreen.classList.add('hidden');
    }
}

// Inizializza il gioco Phaser
function initGame() {
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        pixelArt: true,
        scene: [MainScene],
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        }
    };

    game = new Phaser.Game(config);
}

// Classe Scena Principale
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // Caricamento asset (placeholders)
        // this.load.image('player', 'assets/player.png');
    }

    create() {
        // Background
        this.cameras.main.setBackgroundColor('#111111');
        
        // Testo Info UI nel gioco
        this.dayText = this.add.text(20, 20, `Giorno: ${gameState.day}`, { font: '16px "Press Start 2P"', fill: '#ffffff' });
        this.timeText = this.add.text(20, 50, `Tempo: ${gameState.timeRemaining}h`, { font: '16px "Press Start 2P"', fill: '#ffffff' });
        this.cureText = this.add.text(20, 80, `Cura: ${gameState.cureProgress}%`, { font: '12px "Press Start 2P"', fill: '#55ff55' });
        this.bondText = this.add.text(20, 100, `Famiglia: ${gameState.familyBond}/100`, { font: '12px "Press Start 2P"', fill: '#ff5555' });

        this.add.text(400, 300, 'ESPLORAZIONE LAB / CASA\n\n(In fase di sviluppo)', { font: '24px "Press Start 2P"', fill: '#ffffff', align: 'center' }).setOrigin(0.5);
        
        // Bottoni Placeholder per Azioni
        let workBtn = this.add.text(200, 500, '[ LAVORA ALLA CURA ]', { font: '14px "Press Start 2P"', fill: '#aaa' })
            .setInteractive()
            .on('pointerdown', () => this.doAction('work'))
            .on('pointerover', () => workBtn.setStyle({ fill: '#fff' }))
            .on('pointerout', () => workBtn.setStyle({ fill: '#aaa' }));

        let familyBtn = this.add.text(450, 500, '[ STAI CON LA FAMIGLIA ]', { font: '14px "Press Start 2P"', fill: '#aaa' })
            .setInteractive()
            .on('pointerdown', () => this.doAction('family'))
            .on('pointerover', () => familyBtn.setStyle({ fill: '#fff' }))
            .on('pointerout', () => familyBtn.setStyle({ fill: '#aaa' }));
    }

    doAction(type) {
        if (gameState.timeRemaining <= 0) {
            this.endDay();
            return;
        }

        if (type === 'work') {
            gameState.cureProgress += 10;
            gameState.worldHealth -= 15; // Lavorare velocizza la distruzione
            gameState.familyBond -= 5;
            gameState.timeRemaining -= 2;
        } else if (type === 'family') {
            gameState.familyBond += 10;
            gameState.worldHealth -= 5; // Il mondo peggiora passivamente
            gameState.timeRemaining -= 2;
        }

        this.updateUI();

        if (gameState.timeRemaining <= 0) {
            this.endDay();
        }
    }

    updateUI() {
        this.dayText.setText(`Giorno: ${gameState.day}`);
        this.timeText.setText(`Tempo: ${gameState.timeRemaining}h`);
        this.cureText.setText(`Cura: ${gameState.cureProgress}%`);
        this.bondText.setText(`Famiglia: ${gameState.familyBond}/100`);
    }

    endDay() {
        if (gameState.day >= 7) {
            this.endGame();
        } else {
            gameState.day += 1;
            gameState.timeRemaining = 10; // Reset tempo giornaliero
            this.updateUI();
            
            // Effetto visivo di transizione giorno
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.cameras.main.fadeIn(500, 0, 0, 0);
            });
        }
    }

    endGame() {
        // Segna come completato per impedire future run
        localStorage.setItem(ONE_SHOT_KEY, 'true');
        
        let finale = "Il mondo finisce nel fuoco, ma sei morto stringendo la tua famiglia."; // Default

        if (gameState.cureProgress >= 100 && gameState.familyBond > 80) {
            finale = "FINALE BUONO (SEGRETO):\nHai trovato la cura stabile all'ultimo secondo\ne sei riuscito a salvare sia il partner che il mondo.";
        } else if (gameState.cureProgress >= 100) {
            finale = "FINALE AMARO:\nHai curato il partner e salvato il mondo, ma\nil tuo isolamento vi ha separati per sempre.";
        }

        this.add.rectangle(400, 300, 800, 600, 0x000000).setOrigin(0.5);
        this.add.text(400, 300, finale, { font: '16px "Press Start 2P"', fill: '#ffffff', align: 'center', lineSpacing: 10 }).setOrigin(0.5);
    }
}

// Event Listeners
startBtn.addEventListener('click', () => {
    // Salva le scelte del giocatore
    gameState.player.gender = document.getElementById('player-gender').value;
    gameState.partner.gender = document.getElementById('partner-gender').value;
    gameState.children.type = document.getElementById('children-type').value;

    // Nascondi UI e avvia Phaser
    uiContainer.classList.add('hidden');
    initGame();
});

// Esegui controllo al caricamento
window.onload = checkGameAccess;
