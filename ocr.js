const Tesseract = require("tesseract.js");

async function readSlip(url) {
  const { data: { text } } = await Tesseract.recognize(url, "eng");

  const match = text.match(/\d{2,5}\.\d{2}/);
  return match ? match[0] : "0";
}

module.exports = { readSlip };