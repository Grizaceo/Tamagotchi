import './style.css'

const canvas = document.querySelector<HTMLCanvasElement>('#screen')!
const ctx = canvas.getContext('2d')!

// Estilo retro
ctx.fillStyle = '#000'
ctx.fillRect(0, 0, 320, 240)

ctx.fillStyle = '#0F0'
ctx.font = 'bold 12px monospace'
ctx.fillText('Pompom Tama - boot', 20, 30)
ctx.fillText('UI Canvas OK', 20, 50)

console.log('Canvas initialized and ready!')
