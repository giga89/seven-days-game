// --- MAIN.JS ---
// Gestione della Logica "One-Shot" e del Motore di Gioco con API Backend

// Elementi UI
const uiContainer = document.getElementById('ui-container');
const characterCreator = document.getElementById('character-creator');
const blockScreen = document.getElementById('block-screen');
const startBtn = document.getElementById('start-btn');
const replayBtn = document.getElementById('replay-btn');

// Nuovi elementi Narrativi
const introScreen = document.getElementById('intro-screen');
const nextIntroBtn = document.getElementById('next-intro-btn');
const startDay1Btn = document.getElementById('start-day-1-btn');
let currentIntroStep = 1;

const endingScreen = document.getElementById('ending-screen');
const endingTitle = document.getElementById('ending-title');
const endingDesc = document.getElementById('ending-desc');
const endingImage = document.getElementById('ending-image');
const resetRunBtn = document.getElementById('reset-run-btn');

// Elementi Eventi Casuali
const eventModal = document.getElementById('event-modal');
const eventImage = document.getElementById('event-image');
const eventDesc = document.getElementById('event-desc');
const eventActions = document.getElementById('event-actions');

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
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
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
        this.load.image('lab', 'img/lab.png');
        this.load.image('home', 'img/home.png');
    }

    create() {
        // Background    create() {
        this.bgImage = this.add.image(400, 300, 'lab');
        this.bgImage.setAlpha(0.3); // Scurito per far leggere il testo
        
        // Background box for UI
        this.add.rectangle(100, 85, 220, 150, 0x000000, 1).setOrigin(0.5);

        // Testo Info UI nel gioco (più leggibile)
        const textStyle = { font: 'bold 18px sans-serif', fill: '#ffffff' };
        const smallTextStyle = { font: 'bold 16px sans-serif', fill: '#ffffff' };

        this.dayText = this.add.text(10, 20, `Giorno: ${gameState.day}`, textStyle);
        this.timeText = this.add.text(10, 50, `Tempo: ${gameState.timeRemaining}h`, textStyle);
        
        this.cureText = this.add.text(10, 90, `Cura: ${gameState.cureProgress}%`, { ...smallTextStyle, fill: '#55ff55' });
        this.bondText = this.add.text(10, 110, `Famiglia: ${gameState.familyBond}/100`, { ...smallTextStyle, fill: '#ff5555' });
        this.worldText = this.add.text(10, 130, `Mondo: ${gameState.worldHealth}%`, { ...smallTextStyle, fill: '#5555ff' });
        this.sanityText = this.add.text(10, 150, `Sanità: ${gameState.mentalSanity}%`, { ...smallTextStyle, fill: '#ff55ff' });

        this.add.rectangle(400, 250, 400, 40, 0x000000, 1).setOrigin(0.5);
        this.add.text(400, 250, 'Scegli come passare il tempo:', { font: 'bold 18px sans-serif', fill: '#ffffff', align: 'center' }).setOrigin(0.5);
        
        // Bottoni Azioni
        this.createButton(400, 320, '[ LAVORA AL SICURO (-4h) ]', '#aaa', () => this.doAction('work_safe'));
        this.createButton(400, 370, '[ SPERIMENTA (Rischioso) (-3h) ]', '#faa', () => this.doAction('work_risk'));
        this.createButton(400, 420, '[ STAI CON LA FAMIGLIA (-4h) ]', '#aaf', () => this.doAction('family'));
        this.createButton(400, 470, '[ COINVOLGI PARTNER NELLA RICERCA (-5h) ]', '#ffa', () => this.doAction('mixed'));
        this.createButton(400, 520, '[ DORMI/RIPOSA (-6h) ]', '#fff', () => this.doAction('sleep'));
        
        // Show characters initially
        this.time.delayedCall(100, () => {
            this.doAction('idle');
        });
    }

    createButton(x, y, text, color, callback) {
        let bg = this.add.rectangle(x, y, 320, 36, 0x000000, 1).setOrigin(0.5);
        let btn = this.add.text(x, y, text, { font: 'bold 16px sans-serif', fill: color })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', callback)
            .on('pointerover', () => { btn.setScale(1.1); bg.setScale(1.1); bg.setFillStyle(0x333333, 1); })
            .on('pointerout', () => { btn.setScale(1.0); bg.setScale(1.0); bg.setFillStyle(0x000000, 1); });
        return btn;
    }

    doAction(type) {
        if (type !== 'idle' && this.isTransitioning) return;
        if (type !== 'idle' && gameState.timeRemaining <= 0) return;

        // Effetti base del tempo che passa
        if (type !== 'idle') gameState.worldHealth -= 2; 

        // Gestione overlay HTML dei personaggi
        const overlay = document.getElementById('in-game-characters-overlay');
        overlay.innerHTML = '';
        overlay.classList.remove('hidden');

        const renderHtmlChar = (charObj, scale, leftOffset, bottomOffset = 50, extraTransform = '') => {
            if (!charObj) return '';
            return `<div style="position: absolute; left: ${leftOffset}px; bottom: ${bottomOffset}px; transform: scale(${scale}) ${extraTransform}; transform-origin: center bottom;">
                ${window.generator.renderVectorChar(charObj)}
            </div>`;
        };

        this.bgImage.setAlpha(0.5); // Slightly brighter for action scenes

        if (type === 'work_safe') {
            gameState.cureProgress += 4;
            gameState.familyBond -= 10;
            gameState.mentalSanity -= 8;
            gameState.timeRemaining -= 4;
            this.bgImage.setTexture('lab');
            this.bgImage.setAlpha(1.0);
            // Standing at desk
            overlay.innerHTML = renderHtmlChar(gameState.playerObj, 1.3, 500, 100);
            this.showFeedback("Progresso lentissimo... (+4% Cura)");
        } 
        else if (type === 'work_risk') {
            let success = Math.random() > 0.4;
            if (success) {
                gameState.cureProgress += 12;
                gameState.worldHealth -= 10; 
                this.showFeedback("Hai spinto troppo. (+12% Cura, -10% Mondo)");
            } else {
                gameState.cureProgress -= 2;
                gameState.mentalSanity -= 20;
                this.showFeedback("Esperimento fallito. Mente a pezzi.");
            }
            gameState.familyBond -= 8;
            gameState.timeRemaining -= 3;
            this.bgImage.setTexture('lab');
            this.bgImage.setAlpha(1.0);
            // Trembling and big
            overlay.innerHTML = renderHtmlChar(gameState.playerObj, 1.5, 400, 80, 'translate(-50%, 0)');
            overlay.style.animation = 'tremble 0.1s infinite';
            setTimeout(() => { overlay.style.animation = ''; }, 500);
            this.cameras.main.shake(500, 0.01);
        }
        else if (type === 'family') {
            gameState.familyBond += 20;
            gameState.mentalSanity += 10;
            gameState.timeRemaining -= 4;
            this.bgImage.setTexture('home');
            this.bgImage.setAlpha(1.0);
            // Grouped together
            overlay.innerHTML = 
                renderHtmlChar(gameState.playerObj, 1.1, 280, 80) +
                renderHtmlChar(gameState.partnerObj, 1.1, 400, 80) +
                (gameState.childObj ? renderHtmlChar(gameState.childObj, 0.8, 500, 80) : '') +
                `<div style="position: absolute; left: 380px; bottom: 250px; color: red; font-size: 30px; animation: breathe 1s infinite;">❤️</div>`;
            this.showFeedback("Momenti rassicuranti.");
        }
        else if (type === 'mixed') {
            gameState.cureProgress += 6;
            gameState.familyBond += 5;
            gameState.mentalSanity -= 25; 
            gameState.timeRemaining -= 5;
            this.bgImage.setTexture('lab');
            this.bgImage.setAlpha(1.0);
            overlay.innerHTML = 
                renderHtmlChar(gameState.playerObj, 1.2, 300, 100) +
                renderHtmlChar(gameState.partnerObj, 1.2, 500, 100);
            this.showFeedback("Lavorate insieme, tra le lacrime.");
        }
        else if (type === 'sleep') {
            gameState.mentalSanity += 35;
            gameState.timeRemaining -= 6;
            this.bgImage.setTexture('home');
            this.bgImage.setAlpha(1.0);
            // Sleeping (Rotated 90 deg) on sofa
            overlay.innerHTML = renderHtmlChar(gameState.playerObj, 1.0, 350, 120, 'rotate(90deg)') +
                `<div style="position: absolute; left: 450px; bottom: 200px; color: white; font-size: 20px; font-family: monospace; animation: breathe 2s infinite;">Zzz...</div>`;
            this.showFeedback("Un sonno profondo ma agitato.");
        }
        else if (type === 'idle') {
            this.bgImage.setTexture('lab');
            this.bgImage.setAlpha(1.0);
            overlay.innerHTML = renderHtmlChar(gameState.playerObj, 1.2, 400, 80, 'translate(-50%, 0)');
        }

        // Clamp values
        gameState.cureProgress = Phaser.Math.Clamp(gameState.cureProgress, 0, 100);
        gameState.familyBond = Phaser.Math.Clamp(gameState.familyBond, 0, 100);
        gameState.worldHealth = Phaser.Math.Clamp(gameState.worldHealth, 0, 100);
        gameState.mentalSanity = Phaser.Math.Clamp(gameState.mentalSanity, 0, 100);

        this.updateUI();

        // Controllo game over
        if (type !== 'idle') this.checkState();
    }

    checkState() {
        if (gameState.cureProgress >= 100) {
            this.endGame(false, 'good');
            return;
        }

        if (gameState.timeRemaining <= 0) {
            this.endDay();
            return;
        }

        // Trigger Random Event logic mid-day
        let forcedEvent = false;
        if (gameState.mentalSanity < 20 || gameState.familyBond < 20 || gameState.worldHealth < 20) {
            forcedEvent = true;
        }

        // ~25% chance of event per action
        if (forcedEvent || Math.random() < 0.25) {
            this.triggerRandomEvent(forcedEvent);
        } else {
            this.isTransitioning = false; // unlock inputs immediately if no event
        }
    }

    showFeedback(msg) {
        let fb = this.add.text(400, 200, msg, { font: '20px "Courier New"', fill: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
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
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        
        if (gameState.day >= 7) {
            // Solo tempo scaduto o cura 100% fanno finire il gioco
            if (gameState.cureProgress >= 100) {
                this.endGame(false, 'good');
            } else {
                this.endGame(true, 'explosion');
            }
        } else {
            gameState.day += 1;
            gameState.timeRemaining = 12; // Reset tempo
            gameState.worldHealth -= 10; // Degrado notturno
            this.updateUI();
            
            // Nessun imprevisto forzato a fine giornata, passa al giorno successivo fluido
            document.getElementById('in-game-characters-overlay').style.opacity = '0';
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.time.delayedCall(800, () => {
                this.bgImage.setTexture('lab'); // Reset background to default lab for start of day
                this.bgImage.setAlpha(1.0);
                document.getElementById('in-game-characters-overlay').classList.add('hidden');
                document.getElementById('in-game-characters-overlay').style.opacity = '1';
                this.updateUI(); // Update day and time UI before fading back in
                this.cameras.main.fadeIn(800, 0, 0, 0);
                this.isTransitioning = false; // <-- CRITICAL FIX: Unlock inputs
            });
        }
    }

    triggerRandomEvent(isForced = false) {
        document.getElementById('game-container').classList.add('hidden');
        uiContainer.classList.remove('hidden');
        eventModal.classList.remove('hidden');
        
        const events = [
            {
                text: "Cortocircuito nel computer principale. Un banco di memoria è fritto. Senti puzza di fumo.",
                type: "dilemma",
                image: "img/lab.png",
                options: [
                    { text: "[Salva i Dati] (-10 Sanità, -2 Ore, +5 Cura)", effect: () => { gameState.mentalSanity -= 10; gameState.timeRemaining -= 2; gameState.cureProgress += 5; } },
                    { text: "[Salva l'Hardware] (-5 Cura, -5 Mondo)", effect: () => { gameState.cureProgress -= 5; gameState.worldHealth -= 5; } }
                ]
            },
            {
                text: "Scossa sismica indotta dal collasso. Guardi fuori, il cielo sanguina.",
                type: "dilemma",
                image: "img/lab.png",
                options: [
                    { text: "[Controlla i Danni] (Perdi 2 Ore)", effect: () => { gameState.timeRemaining -= 2; } },
                    { text: "[Ignora] (-10 Mondo, -5 Sanità)", effect: () => { gameState.worldHealth -= 10; gameState.mentalSanity -= 5; } }
                ]
            },
            {
                text: "Il partner ti stringe il braccio. 'Sento che non ci vedremo più. Stai un po' con me.'",
                type: "dilemma",
                image: "img/home.png",
                options: [
                    { text: "[Ignora, il lavoro chiama] (-15 Famiglia, -5 Sanità)", effect: () => { gameState.familyBond -= 15; gameState.mentalSanity -= 5; } },
                    { text: "[Resta un'ora] (Perdi 2 Ore, +10 Famiglia)", effect: () => { gameState.timeRemaining -= 2; gameState.familyBond += 10; } }
                ]
            },
            {
                text: "Trovi vecchi appunti del tuo mentore. Potrebbero contenere intuizioni sull'Anomalia.",
                type: "dilemma",
                image: "img/lab.png",
                options: [
                    { text: "[Studiali a fondo] (Perdi 3 Ore, +8 Cura, -10 Sanità)", effect: () => { gameState.timeRemaining -= 3; gameState.cureProgress += 8; gameState.mentalSanity -= 10; } },
                    { text: "[Bruciali] (+10 Sanità)", effect: () => { gameState.mentalSanity += 10; } }
                ]
            },
            {
                text: "Un momento di quiete. Trovi tuo figlio/a (o una foto di quando eri felice) addormentato sul divano con un tuo vecchio libro.",
                type: "passive",
                btnText: "[Respira profondamente] (+10 Sanità, +5 Famiglia)",
                image: "img/home.png",
                effect: () => { gameState.mentalSanity += 10; gameState.familyBond += 5; }
            },
            {
                text: "Un'illuminazione improvvisa! Ti versi del caffè caldo addosso per l'emozione, ma capisci un passaggio fondamentale.",
                type: "passive",
                btnText: "[L'intuizione è tutto] (+12 Cura, -15 Sanità)",
                image: "img/lab.png",
                effect: () => { gameState.cureProgress += 12; gameState.mentalSanity -= 15; }
            },
            {
                text: "Distrazione letale. Guardi i social network che mostrano il panico globale e perdi la concezione del tempo.",
                type: "passive",
                btnText: "[Spegni il monitor] (-5 Sanità, Perdi 2 Ore)",
                image: "img/lab.png",
                effect: () => { gameState.timeRemaining -= 2; gameState.mentalSanity -= 5; }
            }
        ];

        let ev;
        if (isForced) {
            if (gameState.mentalSanity < 20) {
                ev = {
                    text: "Hai delle allucinazioni terrificanti. L'Anomalia sta infettando la tua mente debole. Non sai più cosa è reale.",
                    type: "dilemma",
                    image: "img/lab.png",
                    options: [
                        { text: "[Stringi i denti] (-15 Cura)", effect: () => { gameState.cureProgress -= 15; } },
                        { text: "[Sottoponiti a terapia shock] (Perdi 6 Ore, +10 Sanità)", effect: () => { gameState.timeRemaining -= 6; gameState.mentalSanity += 10; } }
                    ]
                };
            } else if (gameState.familyBond < 20) {
                ev = {
                    text: "Il partner ha fatto le valigie ed è pronto ad andarsene per sempre. 'Siamo già morti per te'.",
                    type: "dilemma",
                    image: "img/home.png",
                    options: [
                        { text: "[Lasciali Andare] (-30 Sanità, +2 Ore Extra domani)", effect: () => { gameState.mentalSanity -= 30; gameState.timeRemaining += 2; } },
                        { text: "[Implora in ginocchio] (Perdi 6 Ore, +20 Famiglia)", effect: () => { gameState.timeRemaining -= 6; gameState.familyBond += 20; } }
                    ]
                };
            } else {
                ev = events[2]; // Terremoto
            }
        } else {
            ev = events[Math.floor(Math.random() * events.length)];
        }

        eventDesc.innerText = ev.text;
        
        if (ev.image) {
            eventImage.src = ev.image;
            eventImage.classList.remove('hidden');
        } else {
            eventImage.classList.hidden = true;
        }

        // Hide overlay during events
        document.getElementById('in-game-characters-overlay').classList.add('hidden');
        
        eventActions.innerHTML = "";

        const closeEvent = () => {
            // Applica controlli
            gameState.cureProgress = Phaser.Math.Clamp(gameState.cureProgress, 0, 100);
            gameState.familyBond = Phaser.Math.Clamp(gameState.familyBond, 0, 100);
            gameState.worldHealth = Phaser.Math.Clamp(gameState.worldHealth, 0, 100);
            gameState.mentalSanity = Phaser.Math.Clamp(gameState.mentalSanity, 0, 100);
            this.updateUI();

            eventModal.classList.add('hidden');
            uiContainer.classList.add('hidden');
            document.getElementById('game-container').classList.remove('hidden');
            
            // CRITICAL FIX: Restore overlay visibility!
            document.getElementById('in-game-characters-overlay').classList.remove('hidden');

            this.cameras.main.fadeIn(800, 0, 0, 0);
            
            this.isTransitioning = false; // Unlock inputs

            // Check endGame after event might have pushed stats over limit
            if (gameState.worldHealth <= 0) this.endGame(true, 'explosion');
            else if (gameState.mentalSanity <= 0) this.endGame(true, 'sad');
        };

        if (ev.type === 'passive') {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.style.backgroundColor = '#555';
            btn.innerText = ev.btnText;
            btn.onclick = () => { ev.effect(); closeEvent(); };
            eventActions.appendChild(btn);
        } else if (ev.type === 'dilemma') {
            ev.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'btn';
                btn.style.backgroundColor = '#880000';
                btn.innerText = opt.text;
                btn.onclick = () => { opt.effect(); closeEvent(); };
                eventActions.appendChild(btn);
            });
        }
    }

    endGame(premature = false, triggerType = null) {
        let finale = "";
        let type = triggerType;

        if (triggerType === 'fuga') {
            finale = "FINALE FUGA:\nHai mandato al diavolo il mondo. Hai preso la tua famiglia e siete fuggiti insieme. Morirete, ma sarete felici fino all'ultimo respiro.";
            type = "funeral"; // Placeholder image per la fuga
        } else if (triggerType === 'cinico') {
            finale = "FINALE CINICO:\nHai ignorato l'apocalisse chiudendoti nel sonno. Hai 100% di Sanità, ma sei diventato un mostro apatico. Sopravviverai, solo, nel bunker.";
            type = "sad";
        } else if (triggerType === 'good' || gameState.cureProgress >= 100) {
            finale = "FINALE BUONO:\nIncredibile. Hai trovato la cura in tempo. Il mondo è salvo. Ma a che prezzo per te stesso?";
            type = "good";
        } else if (premature && triggerType === 'sad') {
            finale = "Sei impazzito dallo stress.\nLa ricerca è fallita e la tua famiglia ti ha abbandonato.";
            type = "sad";
        } else if (premature && triggerType === 'explosion') {
            finale = "Il mondo è collassato prima del tempo a causa dei tuoi esperimenti avventati.\nNon c'è più nulla da salvare.";
            type = "explosion";
        } else {
            finale = "FINALE TEMPO SCADUTO:\nI 7 giorni sono passati. L'anomalia vi ha raggiunto. È la fine.";
            type = "explosion";
        }

        // Chiama la funzione globale per gestire la UI HTML
        window.showEndingHTML(finale, type);
    }
}

// Funzione globale per mostrare il finale in HTML
window.showEndingHTML = function(finaleText, type) {
    registerRunFinished();
    
    document.getElementById('game-container').classList.add('hidden');
    uiContainer.classList.remove('hidden');
    endingScreen.classList.remove('hidden');
    
    endingDesc.innerText = finaleText;
    
    if (type === 'explosion') {
        endingTitle.innerText = "La Fine del Mondo";
        endingTitle.style.color = "#ff5555";
        endingImage.src = "img/explosion.png";
        endingImage.style.display = "block";
    } else if (type === 'funeral' || type === 'sad') {
        endingTitle.innerText = "Una Perdita Inaccettabile";
        endingTitle.style.color = "#8888ff";
        endingImage.src = "img/funeral.png";
        endingImage.style.display = "block";
    } else {
        endingTitle.innerText = "Sopravvissuti";
        endingTitle.style.color = "#55ff55";
        endingImage.style.display = "none"; // Potremmo aggiungere un'immagine survival in futuro
    }
};

// Event Listeners
startBtn.addEventListener('click', () => {
    gameState.player.gender = document.getElementById('player-gender').value;
    gameState.partner.gender = document.getElementById('partner-gender').value;
    gameState.children.type = document.getElementById('children-type').value;

    let partnerText = gameState.partner.gender === 'male' ? "Il tuo compagno" : "La tua compagna";

    let familyText = `Ma stamattina, prima di uscire, la realtà ti ha colpito. ${partnerText} ti ha guardato con gli occhi gonfi di chi ha pianto tutta la notte. "Tornerai stasera?", ha sussurrato. `;
    
    if (gameState.children.type === 'biological') familyText += "E vostro figlio ti ha stretto la gamba, implorandoti di restare a giocare. ";
    else if (gameState.children.type === 'adopted') familyText += "E la vostra bambina ti ha abbracciato, ignara di tutto. ";
    
    familyText += "Sentono che la fine è vicina.";
    
    document.getElementById('intro-step-3').innerText = familyText;
    
    // Clona l'anteprima dei personaggi nel pannello intro
    const previewClone = document.getElementById('family-preview').innerHTML;
    document.getElementById('intro-family-preview').innerHTML = previewClone;

    // Reset UI intro
    currentIntroStep = 1;
    document.getElementById('intro-step-1').classList.remove('hidden');
    document.getElementById('intro-step-2').classList.add('hidden');
    document.getElementById('intro-step-3').classList.add('hidden');
    document.getElementById('intro-family-preview').classList.add('hidden');
    document.getElementById('intro-step-4').classList.add('hidden');
    nextIntroBtn.classList.remove('hidden');
    startDay1Btn.classList.add('hidden');

    characterCreator.classList.add('hidden');
    introScreen.classList.remove('hidden');
});

nextIntroBtn.addEventListener('click', () => {
    document.getElementById(`intro-step-${currentIntroStep}`).classList.add('hidden');
    if (currentIntroStep === 3) {
        document.getElementById('intro-family-preview').classList.add('hidden');
    }

    currentIntroStep++;
    
    document.getElementById(`intro-step-${currentIntroStep}`).classList.remove('hidden');
    if (currentIntroStep === 3) {
        document.getElementById('intro-family-preview').classList.remove('hidden');
    }

    if (currentIntroStep === 4) {
        nextIntroBtn.classList.add('hidden');
        startDay1Btn.classList.remove('hidden');
    }
});

startDay1Btn.addEventListener('click', () => {
    introScreen.classList.add('hidden');
    uiContainer.classList.add('hidden');
    initGame();
});

const resetGameFunc = async () => {
    try {
        await fetch('/api/reset-run', { method: 'POST' });
        localStorage.removeItem('seven_days_played');
        location.reload();
    } catch (e) {
        console.error("Errore reset", e);
    }
};

replayBtn.addEventListener('click', resetGameFunc);
resetRunBtn.addEventListener('click', resetGameFunc);

// Gestione Resize Responsivo Perfetto
function syncOverlay() {
    const canvas = document.querySelector('#game-container canvas');
    const overlay = document.getElementById('in-game-characters-overlay');
    
    if (canvas && overlay) {
        const rect = canvas.getBoundingClientRect();
        const scale = rect.width / 800;
        
        // Match the overlay exactly to the Phaser canvas
        overlay.style.width = '800px';
        overlay.style.height = '600px';
        overlay.style.left = `${rect.left}px`;
        overlay.style.top = `${rect.top}px`;
        overlay.style.transform = `scale(${scale})`;
        overlay.style.transformOrigin = 'top left';
    }
}

window.addEventListener('resize', syncOverlay);

// Esegui controllo al caricamento
window.onload = () => {
    checkGameAccess();
    setTimeout(syncOverlay, 100); // Give Phaser time to create canvas
};
