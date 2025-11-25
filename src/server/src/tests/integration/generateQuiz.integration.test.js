// generateQuiz.integration.test.js
const { generateQuiz } = require("../../controllers/quizControllers/genrateQuiz");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const axios = require("axios");

// Remove axios mock to call real Flask
// jest.mock("axios"); <-- remove this line

// Helper to mock req/res
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockRequest = (body = {}, user = { id: "studentX" }) => ({ body, user });

// Read PDF file buffer
const pdfFilePath = path.resolve(__dirname, "Ksa Document.pdf");
const pdfBuffer = fs.readFileSync(pdfFilePath);

// Extract text from PDF
let fakeText = "";
beforeAll(async () => {
  const data = await pdfParse(pdfBuffer);
  fakeText = data.text;
});

jest.setTimeout(120000); // increase timeout for multiple requests + PDF parsing + real Flask

describe("Integration Test: generateQuiz → Flask (no DB, real PDF text)", () => {
  const levels = ["easy", "medium", "hard"];

  levels.forEach((level) => {
    it(`should generate quiz for level: ${level} and measure request time`, async () => {
      const req = mockRequest({ pdfId: "pdf001", englishLevel: level });
      const res = mockResponse();

      // Override pdf.doc().get() in controller to return PDF text
      const originalPdf = require("../../config/firebase-config").pdf;
      if (originalPdf) {
        originalPdf.doc = () => ({
          get: async () => ({ exists: true, data: () => ({ text: fakeText }) }),
        });
      }

      // Measure start time
      const start = Date.now();

      // Call your real Flask server
      axios.post = async (url, data) => {
        return axios({
          method: "post",
          url: "http://127.0.0.1:8000/generate_quiz",
          data,
        });
      };

      await generateQuiz(req, res);

      const duration = Date.now() - start;
      console.log(`Request duration Express → Flask (level ${level}): ${duration} ms`);

      // --- Assertions ---
      expect(res.status).not.toHaveBeenCalledWith(expect.any(Number)); // no errors
      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        quiz: { questions: expect.any(Array) },
        id: expect.any(String),
      });
    });
  });
});
