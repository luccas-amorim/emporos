// Gera os ícones do app (assets/images) na linguagem do revamp: um quadrado de tinta com
// as duas barras do Resultado — verde = comprar no Brasil, azul = importar.
// Sem dependências: rasteriza retângulos arredondados com supersampling e grava PNG com
// o zlib do Node. Uso: node scripts/gerar-icones.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const TINTA = [0x17, 0x18, 0x1a];
const TRILHO = [0x2b, 0x2c, 0x2f];
const VERDE = [0x6f, 0xcf, 0x97]; // brasil (escuro)
const AZUL = [0x8d, 0xb8, 0xff]; // exterior (escuro)
const BRANCO = [0xff, 0xff, 0xff];

function dentroRetanguloArredondado(px, py, r) {
  const { x, y, w, h, raio } = r;
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const cx = Math.min(Math.max(px, x + raio), x + w - raio);
  const cy = Math.min(Math.max(py, y + raio), y + h - raio);
  return (px - cx) ** 2 + (py - cy) ** 2 <= raio * raio;
}

// Camadas: { forma, cor, alfa }. Fundo transparente quando nenhuma camada cobre o pixel.
function rasterizar(tam, camadas, amostras = 4) {
  const dados = Buffer.alloc(tam * tam * 4);
  for (let py = 0; py < tam; py++) {
    for (let px = 0; px < tam; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < amostras; sy++) {
        for (let sx = 0; sx < amostras; sx++) {
          const x = px + (sx + 0.5) / amostras;
          const y = py + (sy + 0.5) / amostras;
          // composição "over", de baixo para cima
          let cr = 0, cg = 0, cb = 0, ca = 0;
          for (const { forma, cor, alfa = 1 } of camadas) {
            if (!dentroRetanguloArredondado(x, y, forma)) continue;
            cr = cor[0] * alfa + cr * (1 - alfa);
            cg = cor[1] * alfa + cg * (1 - alfa);
            cb = cor[2] * alfa + cb * (1 - alfa);
            ca = alfa + ca * (1 - alfa);
          }
          r += cr; g += cg; b += cb; a += ca;
        }
      }
      const n = amostras * amostras;
      const i = (py * tam + px) * 4;
      const alfa = a / n;
      // cores pré-multiplicadas → retas
      dados[i] = alfa ? Math.round(r / n / alfa) : 0;
      dados[i + 1] = alfa ? Math.round(g / n / alfa) : 0;
      dados[i + 2] = alfa ? Math.round(b / n / alfa) : 0;
      dados[i + 3] = Math.round(alfa * 255);
    }
  }
  return dados;
}

const TABELA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = TABELA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function bloco(tipo, conteudo) {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(conteudo.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), conteudo]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}
function png(tam, rgba, comAlfa = true) {
  const canais = comAlfa ? 4 : 3;
  const linhas = Buffer.alloc(tam * (tam * canais + 1));
  for (let y = 0; y < tam; y++) {
    linhas[y * (tam * canais + 1)] = 0;
    for (let x = 0; x < tam; x++) {
      const o = (y * tam + x) * 4;
      const d = y * (tam * canais + 1) + 1 + x * canais;
      rgba.copy(linhas, d, o, o + canais);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tam, 0);
  ihdr.writeUInt32BE(tam, 4);
  ihdr[8] = 8;
  ihdr[9] = comAlfa ? 6 : 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', ihdr),
    bloco('IDAT', zlib.deflateSync(linhas, { level: 9 })),
    bloco('IEND', Buffer.alloc(0)),
  ]);
}

// As duas barras, num quadrado de lado `lado` centrado no ícone de tamanho `tam`.
function barras(tam, lado, { mono = false } = {}) {
  const o = (tam - lado) / 2;
  const larg = lado * 0.66;
  const alt = lado * 0.118;
  const gap = lado * 0.088;
  const x = o + (lado - larg) / 2;
  const y1 = o + lado / 2 - alt - gap / 2;
  const y2 = y1 + alt + gap;
  const raio = alt / 2;
  const trilho = mono ? { cor: BRANCO, alfa: 0.35 } : { cor: TRILHO };
  return [
    { forma: { x, y: y1, w: larg, h: alt, raio }, ...trilho },
    { forma: { x, y: y2, w: larg, h: alt, raio }, ...trilho },
    { forma: { x, y: y1, w: larg * 0.78, h: alt, raio }, cor: mono ? BRANCO : VERDE },
    { forma: { x, y: y2, w: larg, h: alt, raio }, cor: mono ? BRANCO : AZUL },
  ];
}

const fundo = (tam, raio = 0) => ({ forma: { x: 0, y: 0, w: tam, h: tam, raio: tam * raio }, cor: TINTA });

const SAIDA = path.join(__dirname, '..', 'assets', 'images');
const ICONES = [
  // iOS e lojas: sem transparência (a Apple arredonda os cantos).
  { arquivo: 'icon.png', tam: 1024, camadas: (t) => [fundo(t), ...barras(t, t)], alfa: false },
  // Android adaptativo: a marca dentro da zona segura (66%) e o fundo à parte.
  { arquivo: 'android-icon-foreground.png', tam: 512, camadas: (t) => barras(t, t * 0.62) },
  { arquivo: 'android-icon-background.png', tam: 512, camadas: (t) => [fundo(t)] },
  { arquivo: 'android-icon-monochrome.png', tam: 432, camadas: (t) => barras(t, t * 0.62, { mono: true }) },
  // Splash: o ícone com cantos, sobre o fundo papel definido no app.json.
  { arquivo: 'splash-icon.png', tam: 1024, camadas: (t) => [fundo(t, 0.22), ...barras(t, t)] },
  { arquivo: 'favicon.png', tam: 48, camadas: (t) => [fundo(t, 0.22), ...barras(t, t)] },
];

for (const { arquivo, tam, camadas, alfa = true } of ICONES) {
  fs.writeFileSync(path.join(SAIDA, arquivo), png(tam, rasterizar(tam, camadas(tam)), alfa));
  console.log(`${arquivo} (${tam}×${tam})`);
}
