// Web Audio API 기반 사운드 효과 (외부 파일 불필요)

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

// 정답 사운드: 경쾌한 도→미→솔 세 음 팡파레
export function playCorrectSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [
      { freq: 523.25, start: 0,    end: 0.12 },  // 도 (C5)
      { freq: 659.25, start: 0.08, end: 0.2  },  // 미 (E5)
      { freq: 783.99, start: 0.16, end: 0.45 },  // 솔 (G5)
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = note.freq;
      gain.gain.setValueAtTime(0.35, now + note.start);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.end);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.start);
      osc.stop(now + note.end);
    }
  } catch {
    // 오디오 지원 안 되면 무시
  }
}

// 오답 사운드: 낮은 삐 (짧은 버저)
export function playWrongSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 200;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    // 오디오 지원 안 되면 무시
  }
}
