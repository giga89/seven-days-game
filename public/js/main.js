// --- MAIN.JS ---
// Gestione della Logica "One-Shot" e del Motore di Gioco con API Backend

// Elementi UI
const uiContainer = document.getElementById('ui-container');
const characterCreator = document.getElementById('character-creator');
const blockScreen = document.getElementById('block-screen');
const startBtn = document.getElementById('start-btn');
const replayBtn = document.getElementById('replay-btn');

// Stato del Gioco
let gameState = {
    day: 1,
    timeRemaining: 12, // Ore disponibili in un giorno (aumentato per più azioni)
    worldHealth: 100,  // Salute del mondo
    cureProgress: 0,   // Progresso della cura
    familyBond: 50,    // Legame familiare
    mentalSanity: 100, // Sanità mentale (nuovo parametro)
    player: {},
    partner: {},
    children: {}
};

let game = null;

// Controllo iniziale tramite API
async function checkGameAccess() {
    try {
        const response = await fetch('/api/check-run');
        const data = await response.json();
        
        if (data.played) {
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
    } catch (e) {
        console.error("Errore nel controllo accesso", e);
        // Fallback locale in caso di errore server per permettere il gioco
        if (localStorage.getItem('seven_days_played')) {
             uiContainer.classList.remove('hidden');
             characterCreator.classList.add('hidden');
             blockScreen.classList.remove('hidden');
        } else {
             uiContainer.classList.remove('hidden');
             characterCreator.classList.remove('hidden');
        }
    }
}

// Registra la fine della partita
async function registerRunFinished() {
    try {
        await fetch('/api/finish-run', { method: 'POST' });
        localStorage.setItem('seven_days_played', 'true');
    } catch (e) {
        console.error("Errore nel registrare la partita", e);
        localStorage.setItem('seven_days_played', 'true');
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

    create() {
        // Background
        this.cameras.main.setBackgroundColor('#111111');
        
        // Testo Info UI nel gioco
        this.dayText = this.add.text(20, 20, `Giorno: ${gameState.day}`, { font: '16px "Press Start 2P"', fill: '#ffffff' });
        this.timeText = this.add.text(20, 50, `Tempo: ${gameState.timeRemaining}h`, { font: '16px "Press Start 2P"', fill: '#ffffff' });
        
        this.cureText = this.add.text(20, 90, `Cura: ${gameState.cureProgress}%`, { font: '10px "Press Start 2P"', fill: '#55ff55' });
        this.bondText = this.add.text(20, 110, `Famiglia: ${gameState.familyBond}/100`, { font: '10px "Press Start 2P"', fill: '#ff5555' });
        this.worldText = this.add.text(20, 130, `Mondo: ${gameState.worldHealth}%`, { font: '10px "Press Start 2P"', fill: '#5555ff' });
        this.sanityText = this.add.text(20, 150, `Sanità: ${gameState.mentalSanity}%`, { font: '10px "Press Start 2P"', fill: '#ff55ff' });

        this.add.text(400, 250, 'Scegli come passare il tempo:', { font: '16px "Press Start 2P"', fill: '#ffffff', align: 'center' }).setOrigin(0.5);
        
        // Bottoni Azioni
        this.createButton(400, 320, '[ LAVORA AL SICURO (-4h) ]', '#aaa', () => this.doAction('work_safe'));
        this.createButton(400, 370, '[ SPERIMENTA (Rischioso) (-3h) ]', '#faa', () => this.doAction('work_risk'));
        this.createButton(400, 420, '[ STAI CON LA FAMIGLIA (-4h) ]', '#aaf', () => this.doAction('family'));
        this.createButton(400, 470, '[ COINVOLGI PARTNER NELLA RICERCA (-5h) ]', '#ffa', () => this.doAction('mixed'));
        this.createButton(400, 520, '[ DORMI/RIPOSA (-6h) ]', '#fff', () => this.doAction('sleep'));
    }

    createButton(x, y, text, color, callback) {
        let btn = this.add.text(x, y, text, { font: '12px "Press Start 2P"', fill: color })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', callback)
            .on('pointerover', () => btn.setScale(1.1))
            .on('pointerout', () => btn.setScale(1.0));
        return btn;
    }

    doAction(type) {
        if (gameState.timeRemaining <= 0) return;

        // Effetti base del tempo che passa
        gameState.worldHealth -= 2; 

        if (type === 'work_safe') {
            gameState.cureProgress += 10;
            gameState.familyBond -= 5;
            gameState.mentalSanity -= 5;
            gameState.timeRemaining -= 4;
            this.showFeedback("Progresso lento ma sicuro.");
        } 
        else if (type === 'work_risk') {
            let success = Math.random() > 0.4;
            if (success) {
                gameState.cureProgress += 25;
                gameState.worldHealth -= 15; // La cura destabilizza
                this.showFeedback("Successo critico! Il mondo trema.");
            } else {
                gameState.cureProgress -= 5;
                gameState.mentalSanity -= 15;
                this.showFeedback("Fallimento. Hai perso dati.");
            }
            gameState.familyBond -= 8;
            gameState.timeRemaining -= 3;
        }
        else if (type === 'family') {
            gameState.familyBond += 15;
            gameState.mentalSanity += 10;
            gameState.timeRemaining -= 4;
            this.showFeedback("Momenti preziosi...");
        }
        else if (type === 'mixed') {
            gameState.cureProgress += 15;
            gameState.familyBond += 5;
            gameState.mentalSanity -= 20; // Molto stressante per entrambi
            gameState.timeRemaining -= 5;
            this.showFeedback("Lavorate insieme, tra le lacrime.");
        }
        else if (type === 'sleep') {
            gameState.mentalSanity += 30;
            gameState.timeRemaining -= 6;
            this.showFeedback("Un sonno agitato.");
        }

        // Clamp values
        gameState.cureProgress = Phaser.Math.Clamp(gameState.cureProgress, 0, 100);
        gameState.familyBond = Phaser.Math.Clamp(gameState.familyBond, 0, 100);
        gameState.worldHealth = Phaser.Math.Clamp(gameState.worldHealth, 0, 100);
        gameState.mentalSanity = Phaser.Math.Clamp(gameState.mentalSanity, 0, 100);

        this.updateUI();

        // Controllo game over anticipato
        if (gameState.worldHealth <= 0 || gameState.mentalSanity <= 0) {
            this.endGame(true);
            return;
        }

        if (gameState.timeRemaining <= 0) {
            this.endDay();
        }
    }

    showFeedback(msg) {
        let fb = this.add.text(400, 200, msg, { font: '12px "Press Start 2P"', fill: '#fff' }).setOrigin(0.5);
        this.tweens.add({
            targets: fb,
            y: 150,
            alpha: 0,
            duration: 1500,
            onComplete: () => fb.destroy()
        });
    }

    updateUI() {
        this.dayText.setText(`Giorno: ${gameState.day}`);
        this.timeText.setText(`Tempo: ${gameState.timeRemaining}h`);
        this.cureText.setText(`Cura: ${gameState.cureProgress}%`);
        this.bondText.setText(`Famiglia: ${gameState.familyBond}/100`);
        this.worldText.setText(`Mondo: ${gameState.worldHealth}%`);
        this.sanityText.setText(`Sanità: ${gameState.mentalSanity}%`);
    }

    endDay() {
        if (gameState.day >= 7) {
            this.endGame();
        } else {
            gameState.day += 1;
            gameState.timeRemaining = 12; // Reset tempo
            gameState.worldHealth -= 10; // Degrado notturno
            this.updateUI();
            
            // Effetto visivo di transizione giorno
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.time.delayedCall(800, () => {
                this.cameras.main.fadeIn(800, 0, 0, 0);
            });

            if (gameState.worldHealth <= 0) this.endGame(true);
        }
    }

    endGame(premature = false) {
        registerRunFinished();
        
        let finale = "";

        if (premature && gameState.mentalSanity <= 0) {
            finale = "Sei impazzito dallo stress.\nLa ricerca è fallita e la tua famiglia ti ha abbandonato.";
        } else if (premature && gameState.worldHealth <= 0) {
            finale = "Il mondo è collassato prima del tempo.\nNon c'è più nulla da salvare.";
        } else if (gameState.cureProgress >= 100 && gameState.familyBond >= 80 && gameState.worldHealth > 20) {
            finale = "FINALE BUONO (SEGRETO):\nHai bilanciato perfettamente tutto.\nIl partner è salvo e il mondo si stabilizzerà.";
        } else if (gameState.cureProgress >= 100) {
            finale = "FINALE AMARO:\nHai curato il partner, ma l'ossessione ha distrutto\nil vostro legame. Ora siete estranei.";
        } else if (gameState.familyBond >= 90) {
            finale = "FINALE DRAMMATICO:\nHai rinunciato alla cura per amare.\nIl partner muore serenamente tra le tue braccia.";
        } else {
            finale = "FINALE NEGATIVO:\nHai fallito in tutto.\nNessuna cura, nessun amore, solo il vuoto.";
        }

        this.add.rectangle(400, 300, 800, 600, 0x000000).setOrigin(0.5);
        this.add.text(400, 300, finale, { font: '14px "Press Start 2P"', fill: '#ffffff', align: 'center', lineSpacing: 15 }).setOrigin(0.5);
    }
}

// Event Listeners
startBtn.addEventListener('click', () => {
    gameState.player.gender = document.getElementById('player-gender').value;
    gameState.partner.gender = document.getElementById('partner-gender').value;
    gameState.children.type = document.getElementById('children-type').value;

    uiContainer.classList.add('hidden');
    initGame();
});

replayBtn.addEventListener('click', async () => {
    try {
        await fetch('/api/reset-run', { method: 'POST' });
        localStorage.removeItem('seven_days_played');
        location.reload();
    } catch (e) {
        console.error("Errore reset", e);
    }
});

// Esegui controllo al caricamento
window.onload = checkGameAccess;
