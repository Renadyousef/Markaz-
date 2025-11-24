const mockCreate = jest.fn();

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

const { generateFromText } = require("../../src/controllers/FlashcardsController.js");

describe("generateFromText Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockCreate.mockReset();
  });

  // 1) SUCCESS
  test("success returns flashcards", async () => {
    req.body = {
      text: "هذا نص تجريبي طويل للاختبار",
      language: "ar",
      limit: 5,
    };

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              sourceDocId: "unknown",
              language: "ar",
              cards: [
                {
                  id: "fc_1",
                  question: "ما هو الاختبار؟",
                  answer: "تعريف الاختبار",
                  hint: null,
                  tags: ["تعريف"],
                },
              ],
            }),
          },
        },
      ],
    });

    await generateFromText(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        count: 1,
        cards: expect.any(Array),
      })
    );
  });

  // 2) INVALID INPUT
  test("invalid: short text", async () => {
    req.body = { text: "قصير" };

    await generateFromText(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // 3) MODEL INVALID JSON
  test("invalid JSON from model", async () => {
    req.body = { text: "هذا نص طويل للاختبار" };

    mockCreate.mockResolvedValue({
      choices: [
        { message: { content: "NOT JSON" } }
      ],
    });

    await generateFromText(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
  });

  // 4) MODEL RETURNS EMPTY CARDS
  test("empty cards", async () => {
    req.body = { text: "هذا نص طويل للاختبار" };

    mockCreate.mockResolvedValue({
      choices: [
        { message: { content: JSON.stringify({ cards: [] }) } }
      ],
    });

    await generateFromText(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
  });

  // 5) INTERNAL ERROR
  test("server error", async () => {
    req.body = { text: "هذا نص طويل" };

    mockCreate.mockRejectedValue(new Error("OpenAI failed"));

    await generateFromText(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
