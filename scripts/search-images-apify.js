/**
 * 使用 Apify 搜索和下载疯狂动物城2解毒笔图片
 * 
 * 使用前请确保：
 * 1. 安装 @apify/client: npm install @apify/client
 * 2. 设置环境变量 APIFY_TOKEN 或在 .env 文件中配置
 * 3. 或直接在代码中替换 YOUR_APIFY_TOKEN
 * 
 * 运行：node scripts/search-images-apify.js
 */

const { ApifyClient } = require('@apify/client');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = path.join(__dirname, '../src/assets/images');
const CURSOR_SIZE = 32;

// 确保目录存在
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// 从环境变量获取 Apify Token，或使用默认值（需要替换）
const APIFY_TOKEN = process.env.APIFY_TOKEN || 'YOUR_APIFY_TOKEN_HERE';

/**
 * 下载图片
 */
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(outputPath);

    protocol
      .get(url, (response) => {
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
          console.log(`✓ Downloaded: ${path.basename(outputPath)}`);
          resolve(outputPath);
        });
      })
      .on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
  });
}

/**
 * 处理图片：调整大小、转换格式
 */
async function processImage(inputPath, outputPath, size = CURSOR_SIZE) {
  try {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toFile(outputPath);
    console.log(`✓ Processed: ${path.basename(outputPath)}`);
    return outputPath;
  } catch (error) {
    console.error(`✗ Failed to process ${inputPath}:`, error.message);
    throw error;
  }
}

/**
 * 使用 Apify 搜索图片
 */
async function searchImagesWithApify(query, maxResults = 10) {
  if (APIFY_TOKEN === 'YOUR_APIFY_TOKEN_HERE') {
    throw new Error(
      '请设置 Apify Token！\n' +
      '方法1: 设置环境变量 export APIFY_TOKEN=your_token\n' +
      '方法2: 在代码中替换 YOUR_APIFY_TOKEN_HERE\n' +
      '获取 Token: https://console.apify.com/account/integrations'
    );
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  console.log(`正在使用 Apify 搜索: ${query}...`);

  try {
    // 使用 Google Images Scraper Actor
    // Actor ID: google-images-scraper
    const run = await client.actor('google-images-scraper').call({
      query: query,
      maxResults: maxResults,
      includeOmittedResults: false,
    });

    console.log(`✓ 搜索完成，找到 ${run.defaultDatasetId} 个结果`);

    // 获取结果
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    return items.map((item) => ({
      url: item.url || item.imageUrl || item.originalUrl,
      title: item.title || item.alt || '',
    }));
  } catch (error) {
    console.error('Apify 搜索失败:', error.message);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 使用 Apify 搜索疯狂动物城2解毒笔图片 ===\n');

  try {
    // 搜索关键词（中英文）
    const queries = [
      'zootopia 2 antidote pen',
      '疯狂动物城2 解毒笔',
      'zootopia antidote pen prop',
    ];

    const allImageUrls = [];

    for (const query of queries) {
      try {
        const results = await searchImagesWithApify(query, 5);
        allImageUrls.push(...results);
        console.log(`从 "${query}" 找到 ${results.length} 张图片\n`);
      } catch (error) {
        console.error(`搜索 "${query}" 失败:`, error.message);
      }
    }

    if (allImageUrls.length === 0) {
      console.log('未找到图片，请检查 Apify Token 是否正确配置。');
      return;
    }

    console.log(`\n总共找到 ${allImageUrls.length} 张图片，开始下载...\n`);

    // 下载和处理图片
    let index = 1;
    for (const item of allImageUrls.slice(0, 5)) {
      // 限制最多下载5张
      if (!item.url) continue;

      try {
        const name = `zootopia-antidote-pen-${index}`;
        const tempPath = path.join(ASSETS_DIR, `${name}-temp`);
        const finalPath = path.join(ASSETS_DIR, `${name}.png`);

        console.log(`[${index}/${Math.min(5, allImageUrls.length)}] 下载中...`);
        await downloadImage(item.url, tempPath);

        console.log(`处理中...`);
        await processImage(tempPath, finalPath, CURSOR_SIZE);

        // 删除临时文件
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }

        index++;
      } catch (error) {
        console.error(`下载失败:`, error.message);
      }
    }

    console.log('\n✓ 所有图片处理完成！');
    console.log('\n提示: 图片已保存到 src/assets/images/');
    console.log('下一步: 运行 npm run update-cursor-presets 更新预设（如果有此脚本）');
  } catch (error) {
    console.error('\n错误:', error.message);
    console.log('\n如果未安装 @apify/client，请运行:');
    console.log('  npm install @apify/client');
    console.log('\n获取 Apify Token: https://console.apify.com/account/integrations');
  }
}

main().catch(console.error);
