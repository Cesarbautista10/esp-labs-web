// From air to numbers: the eight stages between your voice and a number the code can use.

export interface ChainStep {
  readonly box: string;
  readonly title: string;
  /** Rich text (may carry <b>, <code>). */
  readonly text: string;
}

export const STEPS: readonly ChainStep[] = [
  {
    box: "air",
    title: "1 · A sound is moving air",
    text: "Your voice pushes air molecules together and pulls them apart, hundreds of times a second. The pressure swings by about 0.02 Pa when you talk 30 cm away, on top of the 101 325 Pa the air always has. That tiny swing is all the microphone gets.",
  },
  {
    box: "capsule",
    title: "2 · The capsule turns it into volts",
    text: "The KY-037's silver can is an electret capsule: a thin charged foil (the diaphragm) in front of a metal plate. The air moves the foil, the gap changes, and the charge makes a voltage of a few millivolts. There is no amplifier on this module: what you get is that small.",
  },
  {
    box: "AO pin",
    title: "3 · On the AO pin: a small wave on a big steady voltage",
    text: "The capsule needs power, so its output sits on a steady DC voltage, the <b>bias</b> (around 1.5 V here; S1's bias view shows yours). The sound is a ripple of a few mV on top. At true scale you can't see it: the inset magnifies it 100 times.",
  },
  {
    box: "ADC",
    title: "4 · The ADC measures it 16 000 times a second",
    text: "The ADC turns the voltage into a number from 0 to 4095. With 12 dB attenuation the range is 0-3.1 V, so one step is about 0.76 mV and a whisper is only a few steps tall. Smaller attenuation = a smaller range = finer steps (S1's <code>atten</code>).",
  },
  {
    box: "DMA",
    title: "5 · The DMA collects results with no CPU",
    text: "In continuous mode the ADC's own timer starts each conversion, and the DMA (direct memory access) writes every result, 4 bytes, into RAM by itself. After 256 results (1 KB, 16 ms) it hands the frame to our sampler task on core 0. The screen loop on core 1 never waits for it.",
  },
  {
    box: "ring",
    title: "6 · A 4-second ring of samples",
    text: "The sampler writes every sample into a ring of 65 536 slots in PSRAM. Each sample has a running number; the slot is that number modulo 65 536, so the ring overwrites itself every 4.1 s. The scope, the FFT and the recorder read stretches out of it by number, whenever they like.",
  },
  {
    box: "− bias",
    title: "7 · Remove the bias",
    text: "A very slow average follows the bias (it takes about a quarter of a second to settle). Each sample minus that average is the sound alone: a wave around zero. The pot, a different module or a warm room can move the bias; the average simply follows.",
  },
  {
    box: "int16 → dB",
    title: "8 · Numbers a sound program understands",
    text: "×16 turns ADC steps into 16-bit audio units (−32 768 to 32 767, like a WAV file). Every 64 samples (4 ms) the sampler measures the frame's RMS, the average strength, and the level meter turns it into decibels: compared with the ADC's full scale (dBFS) and with your room's quiet.",
  },
];
