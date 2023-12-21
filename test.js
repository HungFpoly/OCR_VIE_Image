const puppeteer = require('puppeteer');
const Tesseract = require('node-tesseract-ocr');
const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');

async function captureAndRecognizeText() {
    try {
      const saveFolder = './captured';
      if (!fs.existsSync(saveFolder)) {
        fs.mkdirSync(saveFolder);
      }
  
      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();
  
      await page.goto('https://www.nettruyenus.com/truyen-tranh/dai-quan-gia-la-ma-hoang/chap-483/1101731');
      const divSelector = '#ctl00_divCenter > div > div.reading-detail.box_doc';
      const pageDivs = await page.$$(`${divSelector} > div[id^="page_"]`);
      const recognizedTexts = [];
  
      for (let i = 0; i < pageDivs.length; i++) {
        const pageDiv = pageDivs[i];
  
        await page.evaluate(() => {
          const chapterNavElement = document.querySelector('#chapterNav');
          if (chapterNavElement) {
            chapterNavElement.style.display = 'none';
          }
        });
  
        const screenshotPath = `${saveFolder}/page_${i + 1}.png`;
        await pageDiv.screenshot({ path: screenshotPath });
  
        // Tạo một tên tập tin mới cho ảnh đã thay đổi kích thước
        const resizedImagePath = `${saveFolder}/page_${i + 1}_resized.png`;
  
        // Thay đổi kích thước ảnh bằng sharp
        await resizeImage(screenshotPath, resizedImagePath, 600, 900);
        console.log(`Page ${i + 1} captured and saved to ${resizedImagePath}`);
  
        await page.waitForTimeout(2000);
  
        const recognizedText = await recognizeTextWithTesseract(resizedImagePath);
        console.log(`Text from page ${i + 1}: ${recognizedText}`);
        recognizedTexts.push(recognizedText);
  
        const txtFilePath = `${saveFolder}/page_${i + 1}_text.txt`;
        fs.writeFileSync(txtFilePath, recognizedText);
        console.log(`Text saved to ${txtFilePath}`);
  
        await page.waitForTimeout(5000);
      }
  
      await browser.close();
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }

async function recognizeTextWithTesseract(imagePath) {
  try {
    console.log('Recognizing text from', imagePath);

    const config = {
      lang: 'vie',
      oem: 3,
      psm: 11,
    };

    const recognizedText = await Tesseract.recognize(imagePath, config);
    console.log("Recognized text:", recognizedText);
    return recognizedText;
  } catch (error) {
    console.error('An error occurred during text recognition:', error);
    throw error;
  }
}

// Hàm thay đổi kích thước ảnh bằng sharp
async function resizeImage(imagePath, width, height) {
    await sharp(imagePath)
      .resize(width, height)
      .toFile(imagePath);
  }

captureAndRecognizeText();
