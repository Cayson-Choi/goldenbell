// Web Audio API 기반 사운드 효과 (외부 파일 불필요)

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

// 정답 사운드: 딩동 벨 소리
export function playCorrectSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 벨 소리를 만들기 위해 기본음 + 배음을 겹침
    const bell = (freq: number, start: number, duration: number) => {
      const harmonics = [
        { ratio: 1,    vol: 0.4  },  // 기본음
        { ratio: 2,    vol: 0.15 },  // 2배음
        { ratio: 3,    vol: 0.08 },  // 3배음
        { ratio: 4.2,  vol: 0.05 },  // 비정수배음 (벨 특유의 울림)
      ];
      for (const h of harmonics) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq * h.ratio;
        gain.gain.setValueAtTime(h.vol, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + duration);
      }
    };

    bell(880, 0, 0.5);     // 딩 (A5 - 높은 음)
    bell(660, 0.25, 0.6);  // 동 (E5 - 낮은 음)
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
