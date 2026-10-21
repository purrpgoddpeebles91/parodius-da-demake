const AudioSystem = (() => {
  let ctx = null;

  function ensureContext() {
    if (!ctx) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      ctx = new AudioCtor();
    }
    return ctx;
  }

  function tone(freq, duration = 0.08, type = 'square', gainValue = 0.03, sweep = 0) {
    const audio = ensureContext();
    if (!audio) return;

    const oscillator = audio.createOscillator();
    const gainNode = audio.createGain();

    oscillator.type = type;
    oscillator.frequency.value = freq;
    if (sweep) oscillator.frequency.linearRampToValueAtTime(freq + sweep, audio.currentTime + duration);

    gainNode.gain.value = gainValue;
    gainNode.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  }

  function playShoot() {
    tone(420, 0.05, 'square', 0.025, 120);
  }

  function playHit() {
    tone(150, 0.09, 'sawtooth', 0.04, -80);
  }

  function playExplode() {
    tone(110, 0.18, 'triangle', 0.04, -140);
  }

  function playPickup() {
    tone(700, 0.12, 'triangle', 0.05, 180);
  }

  function playMenu() {
    tone(260, 0.07, 'sine', 0.028, 40);
  }

  return {
    ensureContext,
    playShoot,
    playHit,
    playExplode,
    playPickup,
    playMenu,
  };
})();
