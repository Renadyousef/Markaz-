// src/tests/integration/chatBot.integration.test.js
const { ChatBot } = require("../../controllers/ChatBotController");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

// Helper to mock req/res
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockRequest = (body = {}, user = { id: "studentX" }) => ({ body, user });

// Read PDF file buffer (same PDF as quiz test)
const pdfFilePath = path.resolve(__dirname, "Ksa Document.pdf");
const pdfBuffer = fs.readFileSync(pdfFilePath);

// Extract text from PDF before tests
let pdfText = "";
beforeAll(async () => {
  const data = await pdfParse(pdfBuffer);
  pdfText = data.text;
});

jest.setTimeout(120000); // large timeout for OpenAI call

describe("Integration Test: ChatBot → OpenAI API (no DB)", () => {
  it("should respond using PDF + user message and measure API time", async () => {
    const req = mockRequest({ pdfId: "pdf001", message: "اعطني ملخص للملف" });
    const res = mockResponse();

    // Override pdf.doc().get() in controller to return local PDF text
    const originalPdf = require("../../config/firebase-config").pdf;
    if (originalPdf) {
      originalPdf.doc = () => ({
        get: async () => ({ exists: true, data: () => ({ text: pdfText }) }),
      });
    }

    const start = Date.now();
    await ChatBot(req, res);
    const duration = Date.now() - start;
    console.log(`ChatBot response time with PDF: ${duration} ms`);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      reply: expect.any(String),
    });
  });

  it("should respond using only user message and measure API time", async () => {
    const req = mockRequest({ message: "كيف ما اتوتر قبل الاختبار؟" });
    const res = mockResponse();

    const start = Date.now();
    await ChatBot(req, res);
    const duration = Date.now() - start;
    console.log(`ChatBot response time without PDF: ${duration} ms`);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      reply: expect.any(String),
    });
  });
});
