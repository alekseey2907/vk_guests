# Конвертация SVG в PNG для React Native / Expo
# Запустите этот скрипт после установки ImageMagick или используйте онлайн-конвертер

# Вариант 1: Использовать онлайн конвертер
# - https://svgtopng.com/
# - https://cloudconvert.com/svg-to-png

# Вариант 2: Установить ImageMagick и запустить команды ниже

# Конвертация иконки (512x512)
# magick convert icon.svg -resize 512x512 icon.png

# Конвертация adaptive icon (1024x1024)
# magick convert adaptive-icon.svg -resize 1024x1024 adaptive-icon.png

# Конвертация splash screen (1284x2778 для iPhone)
# magick convert splash.svg -resize 1284x2778 splash.png

# Конвертация VK App Icon (512x512)
# magick convert vk-app-icon.svg -resize 512x512 vk-app-icon.png

# Вариант 3: Использовать sharp (Node.js)
# npm install sharp
# Затем создайте скрипт convert.js:

<<NODEJS_SCRIPT
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const conversions = [
  { input: 'icon.svg', output: 'icon.png', width: 512, height: 512 },
  { input: 'adaptive-icon.svg', output: 'adaptive-icon.png', width: 1024, height: 1024 },
  { input: 'splash.svg', output: 'splash.png', width: 1284, height: 2778 },
  { input: 'vk-app-icon.svg', output: 'vk-app-icon.png', width: 512, height: 512 },
];

async function convert() {
  for (const { input, output, width, height } of conversions) {
    try {
      await sharp(input)
        .resize(width, height)
        .png()
        .toFile(output);
      console.log(`✅ Converted ${input} -> ${output}`);
    } catch (error) {
      console.error(`❌ Error converting ${input}:`, error.message);
    }
  }
}

convert();
NODEJS_SCRIPT

Write-Host "📁 SVG файлы созданы в папке assets/"
Write-Host ""
Write-Host "Для конвертации в PNG используйте один из вариантов:"
Write-Host "1. Онлайн: https://svgtopng.com/"
Write-Host "2. ImageMagick: magick convert icon.svg icon.png"
Write-Host "3. Node.js + sharp"
Write-Host ""
Write-Host "После конвертации обновите app.json с правильными путями к PNG файлам"
