// The sound track at a glance: what each lab turns sound into and which parts it needs.

export type PartKey = "ky" | "inmp" | "mic" | "spk" | "wifi";

export const SND_PART: Readonly<Record<PartKey, string>> = {
  ky: "KY-037",
  inmp: "INMP441",
  mic: "KY-037 or INMP441",
  spk: "MAX98357A + speaker",
  wifi: "Wi-Fi (W1)",
};

export interface JourneyLab {
  readonly id: string;
  readonly t: string;
  readonly what: string;
  readonly out: string;
  readonly need: readonly PartKey[];
  readonly opt?: readonly PartKey[];
}

export const LABS: readonly JourneyLab[] = [
  {
    id: "S1",
    t: "Hear",
    what: "the raw signal: scope, both mics side by side, bias or bits, the comparator",
    out: "screen",
    need: ["mic"],
  },
  {
    id: "S2",
    t: "Loudness",
    what: "a level meter (dB SPL with the INMP441), a 10-minute diary, an alarm",
    out: "LED · tune",
    need: ["mic"],
    opt: ["spk"],
  },
  {
    id: "S3",
    t: "Clap control",
    what: "claps (not voices) in patterns of 1-4 switch things",
    out: "LED · RGB · sounds",
    need: ["mic"],
    opt: ["spk"],
  },
  {
    id: "S4",
    t: "Recorder",
    what: "voice-activated recording; listen on your phone or the board",
    out: "Wi-Fi · WAV · speaker",
    need: ["mic"],
    opt: ["wifi", "spk"],
  },
  {
    id: "S5",
    t: "Spectrum",
    what: "our own FFT: bands, a waterfall, a tuner with a reference tone",
    out: "pitch",
    need: ["mic"],
    opt: ["spk"],
  },
  {
    id: "S6",
    t: "Sound games",
    what: "a knock lock, Clap Bird, a beat-following party",
    out: "games · sounds",
    need: ["mic"],
    opt: ["spk"],
  },
  {
    id: "S7",
    t: "Speaker",
    what: "a synth: waves, notes, chords, envelopes, tunes, game sounds",
    out: "the speaker",
    need: ["spk"],
  },
  {
    id: "S8",
    t: "Voice FX",
    what: "a parrot that repeats you as a chipmunk or a robot; live echo",
    out: "the speaker",
    need: ["inmp", "spk"],
  },
];
