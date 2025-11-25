/**
 * This file unit-tests the generateQuiz controller.
 * We DO NOT call the real Flask server or Firebase.
 * Instead, we MOCK axios + Firebase to isolate ONLY the controller logic.
 */

const { generateQuiz } = require("../controllers/quizControllers/genrateQuiz");
const axios = require("axios");
const { Quizzes, pdf } = require("../config/firebase-config");

/* -------------------------------------------------------
   MOCK AXIOS
   -------------------------------------------------------
   jest.mock("axios") replaces axios with a fake version.
   We control axios.post() manually inside each test.
--------------------------------------------------------- */
jest.mock("axios");


/* -------------------------------------------------------
   MOCK FIREBASE
   -------------------------------------------------------
   We mock both:
   - pdf.doc(...).get()
   - Quizzes.add()
   so that we don't touch the real database.
--------------------------------------------------------- */
jest.mock("../config/firebase-config", () => ({
  pdf: {
    doc: jest.fn(() => ({
      get: jest.fn(), // defined per test
    })),
  },
  Quizzes: {
    add: jest.fn(), // fake add() method
  },
}));


/* -------------------------------------------------------
   Helper function to mock Express res object
   -------------------------------------------------------
   res.status() and res.json() must:
   1) be functions
   2) return res again (for chaining)
--------------------------------------------------------- */
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};


/* -------------------------------------------------------
   TEST SUITE
--------------------------------------------------------- */
describe("generateQuiz Controller", () => {

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });


  /* -----------------------------------------------------
     TEST 1 — full success
     - Arabic text
     - level = easy
     - Firebase returns PDF text
     - Flask returns questions
     - Controller saves data
     - Controller returns correct JSON
  ------------------------------------------------------- */
  test("should generate quiz successfully (Arabic text + level easy)", async () => {

    const mockArabicText = "هذا نص عربي للاختبار لتوليد الأسئلة.";

    // Mock Firebase: return PDF text
    pdf.doc.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ text: mockArabicText }),
      }),
    });

    // Mock Flask API response
    axios.post.mockResolvedValue({
      data: {
        questions: [
          { 
            type: "TF",
            statement: "جملة عربية للاختبار",
            answer: true
          }
        ],
      },
    });

    // Mock Firebase add()
    Quizzes.add.mockResolvedValue({ id: "quiz123" });

    // Mock req + user
    const req = {
      body: { pdfId: "pdf001", englishLevel: "easy" },
      user: { id: "studentX" },
    };

    const res = mockResponse();

    // Call the controller
    await generateQuiz(req, res);


    // ----------- Assertions ---------------

    // Check Firebase was called correctly
    expect(pdf.doc).toHaveBeenCalledWith("pdf001");

    // Check Flask was called with correct request body
    expect(axios.post).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/generate_quiz",
      { text: mockArabicText, englishLevel: "easy" }
    );

    // Check Firebase save was called
    expect(Quizzes.add).toHaveBeenCalled();

    // Check final controller response
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      quiz: { questions: expect.any(Array) },
      id: "quiz123",
    });
  });



  /* -----------------------------------------------------
     TEST 2 — missing pdfId (validation failure)
  ------------------------------------------------------- */
  test("should return 400 if missing pdfId", async () => {
    const req = { body: {}, user: { id: "studentX" } };
    const res = mockResponse();

    await generateQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: "pdfId required",
    });
  });



  /* -----------------------------------------------------
     TEST 3 — PDF does not exist
  ------------------------------------------------------- */
  test("should return 404 if PDF not found", async () => {

    // Mock Firebase returning "not exists"
    pdf.doc.mockReturnValue({
      get: jest.fn().mockResolvedValue({ exists: false }),
    });

    const req = {
      body: { pdfId: "xxx", englishLevel: "hard" },
      user: { id: "studentX" },
    };
    const res = mockResponse();

    await generateQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: "PDF not found",
    });
  });



  /* -----------------------------------------------------
     TEST 4 — Flask API failure
  ------------------------------------------------------- */
  test("should handle Flask API failure", async () => {
    const mockArabicText = "نص عربي للاختبار.";

    // Mock Firebase returns PDF text
    pdf.doc.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ text: mockArabicText }),
      }),
    });

    // Mock axios POST error
    axios.post.mockRejectedValue(new Error("Flask error"));

    const req = {
      body: { pdfId: "123", englishLevel: "medium" },
      user: { id: "studentX" },
    };
    const res = mockResponse();

    await generateQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: "Flask error",
    });
  });

});
