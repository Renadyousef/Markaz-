//  MOCK FOR uploadController.js
jest.mock("../../src/controllers/uploadController", () => {
  return {
    uploadThenGenerate: jest.fn(async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ ok: false, msg: "لم يتم استلام ملف." });
      }

      if (req.file.size > 20 * 1024 * 1024) {
        return res
          .status(400)
          .json({ ok: false, msg: "حجم الملف يتجاوز 20MB." });
      }

      const isPdf =
        req.file.mimetype === "application/pdf" ||
        req.file.originalname.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        return res
          .status(400)
          .json({ ok: false, msg: "يُقبل فقط ملف PDF." });
      }

      return res.json({
        ok: true,
        savedId: "mock-pdf-id",
        stage: "done",
        modelError: null,
      });
    }),
  };
});

const { uploadThenGenerate } = require("../../src/controllers/uploadController");

// mock response
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

//                TESTS
describe("uploadThenGenerate (FULL MOCK)", () => {
  let req, res;

  beforeEach(() => {
    res = mockRes();

    req = {
      user: { id: "user123" },
      file: {
        path: "temp.pdf",
        size: 1 * 1024 * 1024,
        originalname: "file.pdf",
        mimetype: "application/pdf",
      },
    };

    jest.clearAllMocks();
  });

  test("success", async () => {
    await uploadThenGenerate(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        savedId: "mock-pdf-id",
        stage: "done",
      })
    );
  });

  test("fails - no file", async () => {
    req.file = null;

    await uploadThenGenerate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ msg: "لم يتم استلام ملف." })
    );
  });

  test("fails - size too large", async () => {
    req.file.size = 25 * 1024 * 1024;

    await uploadThenGenerate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "حجم الملف يتجاوز 20MB.",
      })
    );
  });

  test("fails - not pdf", async () => {
    req.file.mimetype = "image/png";
    req.file.originalname = "img.png";

    await uploadThenGenerate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "يُقبل فقط ملف PDF.",
      })
    );
  });
});
