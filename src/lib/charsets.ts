import type { CharsetOption } from "../types/studio";

export const CHARSETS: CharsetOption[] = [
  {
    id: "standard",
    name: "Standard",
    chars: '@%#*+=-:. ',
    description: "Klasik ASCII art karakter seti",
  },
  {
    id: "detailed",
    name: "Detailed",
    chars: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
    description: "Çok detaylı 70 karakterlik geniş set",
  },
  {
    id: "blocks",
    name: "Blocks",
    chars: "█▓▒░ ",
    description: "Blok karakterler — temiz ve modern görünüm",
  },
  {
    id: "minimal",
    name: "Minimal",
    chars: "@+. ",
    description: "4 karakterle sade, güçlü kontrast",
  },
  {
    id: "binary",
    name: "Binary",
    chars: "10 ",
    description: "Sadece 1 ve 0 — hacker estetiği",
  },
  {
    id: "matrix",
    name: "Matrix",
    chars: "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ012345789Z ",
    description: "Matrix tarzı Japon karakterler",
  },
  {
    id: "braille",
    name: "Braille",
    chars: "⣿⣷⣯⣟⡿⢿⣻⣽⣾⠿⣶⣴⣤⣀⠀",
    description: "Braille nokta karakterleri",
  },
  {
    id: "box",
    name: "Box Drawing",
    chars: "╬╠╦╔╗╚╝═║┼├┬┌┐└┘─│·",
    description: "Kutu çizim karakterleri",
  },
  {
    id: "emoji",
    name: "Dots",
    chars: "●◉○◎◌◦·  ",
    description: "Nokta tabanlı yuvarlak karakterler",
  },
  {
    id: "custom",
    name: "Custom",
    chars: "",
    description: "Kendi karakter setini yaz",
  },
];

export function getCharsetById(id: string): CharsetOption {
  return CHARSETS.find((c) => c.id === id) ?? CHARSETS[0];
}
