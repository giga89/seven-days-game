class CharacterGenerator {
    constructor() {
        this.traits = {
            hairColors: ['#2b2b2b', '#8b4513', '#d4af37', '#800000', '#ff4500', '#c0c0c0', '#4a4a4a', '#ffb6c1'],
            eyeColors: ['#8b4513', '#4169e1', '#2e8b57', '#808080', '#1a1a1a', '#8a2be2'],
            skinTones: ['#ffe0bd', '#f1c27d', '#c68642', '#8d5524', '#3d2210', '#ffebcd', '#d2b48c'],
            hairStyles: [
                'Corti', 'Lunghi', 'Spettinati', 'Caschetto', 
                'Rasati', 'Coda', 'Trecce', 'Ciuffo', 'Afro', 'Calvo'
            ],
            clothing: [
                'Camice da Laboratorio', 'Felpa Oversize', 'Camicia a Quadri', 
                'T-shirt Vintage', 'Maglione a Collo Alto', 'Giacca di Pelle', 
                'Grembiule da Lavoro', 'Canottiera', 'Vestito Estivo'
            ],
            accessories: [
                'Nessuno', 'Occhiali da Vista', 'Occhiali Rotondi', 'Piercing al Naso', 
                'Cuffie al Collo', 'Sciarpa', 'Occhiaie Profonde', 'Cerotti', 'Barba Incolta'
            ]
        };
    }

    getRandomTrait(traitArray) {
        return traitArray[Math.floor(Math.random() * traitArray.length)];
    }

    generateParent(gender) {
        return {
            type: 'parent',
            gender: gender,
            hairColor: this.getRandomTrait(this.traits.hairColors),
            eyeColor: this.getRandomTrait(this.traits.eyeColors),
            skinTone: this.getRandomTrait(this.traits.skinTones),
            hairStyle: this.getRandomTrait(this.traits.hairStyles),
            clothing: this.getRandomTrait(this.traits.clothing),
            accessory: this.getRandomTrait(this.traits.accessories)
        };
    }

    generateBiologicalChild(parent1, parent2) {
        // Eredita colori dai genitori, ma stile e vestiti sono propri
        return {
            type: 'biological_child',
            hairColor: Math.random() > 0.5 ? parent1.hairColor : parent2.hairColor,
            eyeColor: Math.random() > 0.5 ? parent1.eyeColor : parent2.eyeColor,
            skinTone: Math.random() > 0.5 ? parent1.skinTone : parent2.skinTone,
            hairStyle: this.getRandomTrait(this.traits.hairStyles),
            clothing: this.getRandomTrait(this.traits.clothing),
            accessory: this.getRandomTrait(this.traits.accessories)
        };
    }

    generateAdoptedChild() {
        return {
            type: 'adopted_child',
            seed: 'Child' + Math.random().toString(36).substring(7),
            hairColor: this.getRandomTrait(this.traits.hairColors),
            eyeColor: this.getRandomTrait(this.traits.eyeColors),
            skinTone: this.getRandomTrait(this.traits.skinTones),
            hairStyle: this.getRandomTrait(this.traits.hairStyles),
            clothing: this.pickRandom(['Camice da Laboratorio', 'Felpa', 'Giacca']),
            accessory: this.getRandomTrait(this.traits.accessories)
        };
    }

    renderVectorChar(characterData) {
        const skin = characterData.skinTone.replace('#', '');
        const hair = characterData.hairColor.replace('#', '');
        const isMale = characterData.gender === 'male' || characterData.gender === 'Bambino';

        let topVal = 'shortFlat';
        if (isMale) {
            if (characterData.hairStyle === 'Lunghi' || characterData.hairStyle === 'Coda' || characterData.hairStyle === 'Trecce') topVal = 'shaggy';
            else if (characterData.hairStyle === 'Spettinati' || characterData.hairStyle === 'Afro') topVal = 'shortWaved';
            else if (characterData.hairStyle === 'Calvo' || characterData.hairStyle === 'Rasati') topVal = 'shavedSides';
            else topVal = 'shortFlat';
        } else {
            if (characterData.hairStyle === 'Corti' || characterData.hairStyle === 'Caschetto' || characterData.hairStyle === 'Rasati' || characterData.hairStyle === 'Calvo') topVal = 'bob';
            else if (characterData.hairStyle === 'Spettinati' || characterData.hairStyle === 'Afro') topVal = 'curly';
            else topVal = 'longButNotTooLong';
        }

        let facialHairVal = (isMale && Math.random() > 0.7) ? '&facialHairProbability=100' : '&facialHairProbability=0';

        let url = `https://api.dicebear.com/9.x/avataaars/svg?seed=${characterData.seed}&skinColor=${skin}&hairColor=${hair}&top=${topVal}${facialHairVal}&backgroundColor=transparent`;

        return `
            <style>
                @keyframes breathe {
                    0% { transform: scaleY(1); }
                    50% { transform: scaleY(1.03) translateY(-2px); }
                    100% { transform: scaleY(1); }
                }
            </style>
            <div class="vector-char" style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 160px; position: relative; animation: breathe 3s infinite ease-in-out;">
                <img src="${url}" style="width: 140px; height: 140px; filter: drop-shadow(4px 4px 0px rgba(0,0,0,0.4)); object-fit: contain; margin-bottom: 5px;" />
                <!-- Ombra a terra -->
                <div style="width: 90px; height: 12px; background-color: rgba(0,0,0,0.6); border-radius: 50%; position: absolute; bottom: 0px; z-index: -1;"></div>
            </div>
        `;
    }

    renderCharacterHTML(characterData, labelText) {
        let label = labelText || "";
        if (!label) {
            if (characterData.type === 'parent') {
                label = characterData.isPlayer ? 'Tu (Dr. K.)' : (characterData.gender === 'male' ? 'Il tuo Compagno' : 'La tua Compagna');
            } else {
                label = 'Figlio/a';
            }
        }
                   
        return `
            <div class="character-portrait" style="background-color: #333; padding: 10px; margin-bottom: 10px; border-radius: 8px; border: 2px solid #555; color: #fff; text-align: center; flex: 1; min-width: 120px;">
                <div style="font-weight: bold; font-size: 10px; margin-bottom: 10px;">${label}</div>
                
                <div style="transform: scale(0.7); transform-origin: center bottom;">
                    ${this.renderVectorChar(characterData)}
                </div>

                <div style="font-size: 8px; margin-top: 5px; color: #ccc;">${characterData.clothing}</div>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.generator = new CharacterGenerator();

    const previewContainer = document.getElementById('family-preview');
    const form = document.getElementById('char-form');
    
    if (!form || !previewContainer) return;

    const updatePreview = (forceAlt = false) => {
        const playerGender = document.getElementById('player-gender').value;
        const playerSkin = document.getElementById('player-skin').value;
        const playerHair = document.getElementById('player-hair').value;
        const playerHairStyle = document.getElementById('player-hair-style').value;
        const playerClothing = document.getElementById('player-clothing').value;
        
        const partnerGender = document.getElementById('partner-gender').value;
        const childrenType = document.getElementById('children-type').value;

        const player = window.generator.generateParent(playerGender);
        player.isPlayer = true;
        // Override with custom values
        if (playerSkin) player.skinTone = playerSkin;
        if (playerHair) player.hairColor = playerHair;
        if (playerHairStyle) player.hairStyle = playerHairStyle;
        if (playerClothing) player.clothing = playerClothing;

        const partner = window.generator.generateParent(partnerGender);

        let children = [];
        if (childrenType !== 'Nessuno' && childrenType !== 'none') {
            const childGender = Math.random() > 0.5 ? 'male' : 'female';
            const child = window.generator.generateParent(childGender);
            child.seed = 'Child' + Math.random().toString(36).substring(7);
            children.push(child);
        }

        // Render preview
        previewContainer.innerHTML = window.generator.renderCharacterHTML(player, 'Tu');
        previewContainer.innerHTML += window.generator.renderCharacterHTML(partner, 'Partner');
        
        if (children.length > 0) {
            const child = children[0];
            if (childrenType === 'biological' || childrenType === 'Bambino Biologico') {
                // Eredita tratti
                child.skinTone = Math.random() > 0.5 ? player.skinTone : partner.skinTone;
                child.hairColor = Math.random() > 0.5 ? player.hairColor : partner.hairColor;
                child.eyeColor = Math.random() > 0.5 ? player.eyeColor : partner.eyeColor;
            }
            previewContainer.innerHTML += window.generator.renderCharacterHTML(child);
        }

        // Save to global gameState for use in main.js
        if (typeof gameState !== 'undefined') {
            gameState.playerObj = player;
            gameState.partnerObj = partner;
            gameState.childObj = children.length > 0 ? children[0] : null;
        }
    };

    document.getElementById('player-gender').addEventListener('change', updatePreview);
    document.getElementById('partner-gender').addEventListener('change', updatePreview);
    document.getElementById('children-type').addEventListener('change', updatePreview);
    document.getElementById('player-skin').addEventListener('input', updatePreview);
    document.getElementById('player-hair').addEventListener('input', updatePreview);
    document.getElementById('player-hair-style').addEventListener('change', updatePreview);
    document.getElementById('player-clothing').addEventListener('change', updatePreview);
    
    const rerollBtn = document.getElementById('reroll-btn');

    if (rerollBtn) {
        rerollBtn.addEventListener('click', () => updatePreview(false));
    }

    updatePreview(false);
});
