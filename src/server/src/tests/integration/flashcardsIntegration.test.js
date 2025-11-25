/**
 * Integration Test: FlashcardsController → OpenAI API (no DB)
 */

process.env.NODE_ENV = "test";

/* ---------------------------------------------------------
   1) Mock OpenAI BEFORE loading controller
--------------------------------------------------------- */
jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  sourceDocId: "pdf001",
                  language: "ar",
                  cards: [
                    {
                      id: "fc_1",
                      question: "ما هي العضلة؟",
                      answer: "هي نسيج يسمح بالحركة",
                      hint: null,
                      tags: ["تعريف"],
                    },
                  ],
                }),
              },
            },
          ],
        }),
      },
    },
  }));
});

/* ---------------------------------------------------------
   2) Mock firebase-admin BEFORE loading controller
--------------------------------------------------------- */
jest.mock("firebase-admin", () => ({
  firestore: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(async () => ({
          exists: true,
          data: () => ({ text: mockPdfText }),
        })),
        set: jest.fn(),
      })),
      add: jest.fn(),
      where: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
  }),
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() },
}));


/* ---------------------------------------------------------
   3) Mock firebase-config BEFORE loading controller
--------------------------------------------------------- */
let mockPdfText = "";

jest.mock("../../config/firebase-config", () => ({
  pdf: {
    doc: () => ({
      get: async () => ({
        exists: true,
        data: () => ({ text: mockPdfText }),
      }),
    }),
  },
  flashCards: {
    add: jest.fn(),
  },
}));

/* ---------------------------------------------------------
   Now load the controller AFTER all mocks
--------------------------------------------------------- */
const {
  generateFromPdfId,
  generateFromText,
} = require("../../controllers/FlashcardsController");

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (body = {}, user = { id: "studentX" }, params = {}, query = {}) => ({
  body,
  user,
  params,
  query,
});

/* ---------------------------------------------------------
   Load PDF text BEFORE tests
--------------------------------------------------------- */
beforeAll(async () => {
  const pdfPath = path.resolve(__dirname, "Ksa Document.pdf");
  const pdfBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(pdfBuffer);
  mockPdfText = data.text;
});

jest.setTimeout(120000);

/* ---------------------------------------------------------
   Tests
--------------------------------------------------------- */
describe("Integration Test: FlashcardsController → OpenAI API (no DB)", () => {
  
  it("should generate flashcards using PDF and measure API time", async () => {
    const req = mockRequest(
      { limit: 5 },          // body
      { id: "studentX" },    // user
      { pdfId: "pdf001" },   // params
      {}                     // query
    );

    const res = mockResponse();

    const start = Date.now();
    await generateFromPdfId(req, res);
    const duration = Date.now() - start;

    console.log(`Flashcards response time with PDF: ${duration} ms`);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
  ok: true,
  pdfId: "pdf001",
  language: "ar",
  count: expect.any(Number),
  cards: expect.any(Array),
  chunkCount: expect.any(Number),
});

  });

  
});
