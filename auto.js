const puppeteer = require('puppeteer');
const Tesseract = require('node-tesseract-ocr');
const fs = require('fs');
const axios = require('axios');

async function captureAndRecognizeText() {
  try {
    const saveFolder = './captured_pages';
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
      await page.setViewport({ width: 600, height: 900 });
      await pageDiv.screenshot({ path: screenshotPath });
      console.log(`Page ${i + 1} captured and saved to ${screenshotPath}`);

      await page.waitForTimeout(2000);

      const recognizedText = await recognizeTextWithTesseract(screenshotPath);
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

captureAndRecognizeText();
