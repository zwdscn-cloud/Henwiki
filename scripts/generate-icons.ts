/**
 * 从SVG生成PNG图标文件
 * 需要安装 sharp: pnpm add -D sharp @types/sharp
 * 运行: pnpm tsx scripts/generate-icons.ts
 */

import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const publicDir = join(process.cwd(), 'public')
const svgPath = join(publicDir, 'icon.svg')

async function generateIcons() {
  try {
    const svgBuffer = readFileSync(svgPath)
    
    // 生成浅色主题图标 (32x32)
    const lightIcon32 = await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toBuffer()
    writeFileSync(join(publicDir, 'icon-light-32x32.png'), lightIcon32)
    
    // 生成深色主题图标 (32x32)
    // 注意：这里需要手动修改SVG中的颜色，或者使用不同的SVG文件
    const darkIcon32 = await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toBuffer()
    writeFileSync(join(publicDir, 'icon-dark-32x32.png'), darkIcon32)
    
    // 生成Apple图标 (180x180)
    const appleIcon = await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toBuffer()
    writeFileSync(join(publicDir, 'apple-icon.png'), appleIcon)
    
    console.log('✅ 图标生成成功！')
    console.log('   - icon-light-32x32.png')
    console.log('   - icon-dark-32x32.png')
    console.log('   - apple-icon.png')
  } catch (error) {
    console.error('❌ 生成图标失败:', error)
    console.log('\n提示：如果缺少sharp依赖，请运行: pnpm add -D sharp @types/sharp')
  }
}

generateIcons()
