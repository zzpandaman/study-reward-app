/**
 * 下载和处理鼠标光标图片脚本
 * 下载疯狂动物城2解毒笔图片并添加到预设
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = path.join(__dirname, '../src/assets/images');
const CURSOR_SIZE = 32; // 鼠标光标推荐尺寸

// 确保目录存在
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

/**
 * 下载图片
 */
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(outputPath);

    protocol
      .get(url, (response) => {
        // 处理重定向
        if (response.statusCode === 301 || response.statusCode === 302) {
          return downloadImage(response.headers.location, outputPath)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded: ${outputPath}`);
          resolve(outputPath);
        });
      })
      .on('error', (err) => {
        fs.unlink(outputPath, () => {}); // 删除部分下载的文件
        reject(err);
      });
  });
}

/**
 * 处理图片：调整大小、转换格式、优化
 */
async function processImage(inputPath, outputPath, size = CURSOR_SIZE) {
  try {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }, // 透明背景
      })
      .png()
      .toFile(outputPath);
    console.log(`✓ Processed: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error(`✗ Failed to process ${inputPath}:`, error.message);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('开始下载和处理图片...\n');

  const images = [
    {
      url: 'https://img.alicdn.com/imgextra/i1/2212471592349/O1CN012vaTQz1TDtT1PyBU1_!!4611686018427385245-0-item_pic.jpg_q50.jpg_.webp',
      name: 'zootopia-antidote-pen-1',
      description: '疯狂动物城2解毒笔（来源：用户提供）',
    },
  ];

  // 注意：实际项目中，Apify 需要 API token 和配置
  // 这里我们使用一些可能的图片链接作为示例
  // 如果需要使用 Apify，需要安装 @apify/client 并配置
  const searchResults = [
    // 这些是示例URL，实际使用时需要替换为真实的搜索结果
    // 可以通过 Apify 的 Google Image Scraper 或类似工具获取
  ];

  const processedImages = [];

  // 下载和处理用户提供的图片
  for (const image of images) {
    try {
      const tempPath = path.join(ASSETS_DIR, `${image.name}-temp.webp`);
      const finalPath = path.join(ASSETS_DIR, `${image.name}.png`);

      console.log(`正在下载: ${image.name}...`);
      await downloadImage(image.url, tempPath);

      console.log(`正在处理: ${image.name}...`);
      await processImage(tempPath, finalPath, CURSOR_SIZE);

      // 删除临时文件
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      processedImages.push({
        path: finalPath,
        name: image.name,
        description: image.description,
      });
    } catch (error) {
      console.error(`处理 ${image.name} 失败:`, error.message);
    }
  }

  console.log('\n✓ 所有图片处理完成！');
  console.log(`\n已处理的图片:`);
  processedImages.forEach((img) => {
    console.log(`  - ${img.name}.png: ${img.description}`);
  });

  console.log('\n提示: 如果需要抠图（移除背景），可以使用在线工具：');
  console.log('  - https://www.remove.bg/');
  console.log('  - https://photopea.com/');
  console.log('  或者手动使用图像编辑软件处理');
}

main().catch(console.error);
