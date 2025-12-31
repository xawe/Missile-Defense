import { Game } from './core/Game.js';

// Wait for DOM to load
window.addEventListener('DOMContentLoaded', () => {
    // Initialize Game
    const game = new Game();

    // Setup global UI handlers via Game or here
    window.setWeapon = (type) => game.setWeapon(type);

    // Audio controls
    const sfxVolume = document.getElementById('sfx-volume');
    if (sfxVolume) {
        sfxVolume.addEventListener('input', (e) => {
            game.audio.sfxVolume = e.target.value / 100;
            document.getElementById('sfx-value').textContent = e.target.value + '%';
        });
    }

    const musicVolume = document.getElementById('music-volume');
    if (musicVolume) {
        musicVolume.addEventListener('input', (e) => {
            game.audio.musicVolume = e.target.value / 100;
            document.getElementById('music-value').textContent = e.target.value + '%';
        });
    }

    const muteToggle = document.getElementById('mute-toggle');
    if (muteToggle) {
        muteToggle.addEventListener('click', () => {
            game.audio.isMuted = !game.audio.isMuted;
            muteToggle.textContent = game.audio.isMuted ? '🔇' : '🔊';
        });
    }

    const audioToggleBtn = document.getElementById('audio-toggle');
    if (audioToggleBtn) {
        audioToggleBtn.addEventListener('click', () => {
            const audioControls = document.getElementById('audio-controls');
            audioControls.classList.toggle('minimized');
            audioToggleBtn.textContent = audioControls.classList.contains('minimized') ? '+' : '-';
        });
    }


});
