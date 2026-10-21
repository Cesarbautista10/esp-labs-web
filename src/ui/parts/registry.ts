import type { ComponentType } from "react";
import { Bluetooth, Beacon, Chat, Keyboard, Mouse, Note, Padlock, Radar } from "./drawings/ble";
import {
  Antenna,
  Button,
  Cable,
  DevKit,
  Header,
  Knob,
  Module,
  RedLed,
  RgbLed,
  Sensor,
  UsbC,
} from "./drawings/board";
import { Showcase, Tft } from "./drawings/display";
import { Cloud, Notebook, PhoneBle, PhoneWifi, Router, Tower } from "./drawings/radio";
import { Card, Cards, Coins, KeyFob, KeyFobs, Memory, Range, Reader } from "./drawings/rfid";
import { Burst, Cassette, Equalizer, Gamepad, Meter, Mic, Speaker } from "./drawings/sound";

// Every part in the library, by name, with the words a screen reader would use for it.
// A drawing is SVG content in a 64 × 64 box; <PartIcon> wraps it. `scale` enlarges the small
// parts so every part fills its box about as much as the others.
export const PARTS = {
  devkit: { draw: DevKit, label: "ESP32-S3 DevKitC board", scale: 1.12 },
  module: { draw: Module, label: "ESP32-S3 WROOM module", scale: 1.15 },
  usbc: { draw: UsbC, label: "USB-C port", scale: 1.15 },
  cable: { draw: Cable, label: "USB-C cable", scale: 1.1 },
  button: { draw: Button, label: "push button", scale: 1.3 },
  "rgb-led": { draw: RgbLed, label: "RGB LED", scale: 1.4 },
  led: { draw: RedLed, label: "LED" },
  header: { draw: Header, label: "pin header", scale: 1.1 },
  antenna: { draw: Antenna, label: "PCB antenna", scale: 1.1 },
  sensor: { draw: Sensor, label: "sensor board", scale: 1.45 },
  knob: { draw: Knob, label: "rotary knob", scale: 1.25 },
  tft: { draw: Tft, label: "TFT display", scale: 1.12 },
  showcase: { draw: Showcase, label: "display showing colour bars", scale: 1.12 },
  router: { draw: Router, label: "Wi-Fi router" },
  "phone-wifi": { draw: PhoneWifi, label: "phone on Wi-Fi", scale: 1.15 },
  "phone-ble": { draw: PhoneBle, label: "phone app over Bluetooth", scale: 1.15 },
  cloud: { draw: Cloud, label: "cloud" },
  tower: { draw: Tower, label: "radio mast" },
  notebook: { draw: Notebook, label: "notebook" },
  reader: { draw: Reader, label: "RC522 card reader", scale: 1.05 },
  card: { draw: Card, label: "RFID card" },
  cards: { draw: Cards, label: "two RFID cards" },
  memory: { draw: Memory, label: "card memory sectors" },
  coins: { draw: Coins, label: "card with credits" },
  range: { draw: Range, label: "card above the reader" },
  keyfob: { draw: KeyFob, label: "key fob tag", scale: 1.35 },
  keyfobs: { draw: KeyFobs, label: "two key fob tags", scale: 1.1 },
  bluetooth: { draw: Bluetooth, label: "Bluetooth" },
  radar: { draw: Radar, label: "scanner dish", scale: 1.15 },
  beacon: { draw: Beacon, label: "beacon", scale: 1.2 },
  chat: { draw: Chat, label: "chat bubbles" },
  padlock: { draw: Padlock, label: "padlock", scale: 1.3 },
  keyboard: { draw: Keyboard, label: "keyboard" },
  note: { draw: Note, label: "music note" },
  mouse: { draw: Mouse, label: "mouse", scale: 1.05 },
  mic: { draw: Mic, label: "I²S microphone", scale: 1.3 },
  meter: { draw: Meter, label: "level meter", scale: 1.1 },
  burst: { draw: Burst, label: "clap" },
  cassette: { draw: Cassette, label: "cassette recorder" },
  equalizer: { draw: Equalizer, label: "spectrum bars" },
  gamepad: { draw: Gamepad, label: "game pad" },
  speaker: { draw: Speaker, label: "speaker" },
} as const satisfies Record<string, { draw: ComponentType; label: string; scale?: number }>;

export type PartName = keyof typeof PARTS;
export const PART_NAMES = Object.keys(PARTS) as PartName[];
