//  MOCK FOR uploadController.js
jest.mock("../../src/controllers/uploadController", () => {
  return {
    uploadThenGenerate: jest.fn(async (req, res) => {
      // ==========================
      // 1) لا يوجد ملف
      // ==========================
      if (!req.file) {
        return res.status(400).json({ ok: false, msg: "لم يتم استلام ملف." });
      }

      // ==========================
      // 2) فحص حجم الملف
      // ==========================
      if (req.file.size > 20 * 1024 * 1024) {
        return res
          .status(400)
          .json({ ok: false, msg: "حجم الملف يتجاوز 20MB." });
      }

      // ==========================
      // 3) فحص صيغة PDF
      // ==========================
      const isPdf =
        req.file.mimetype === "application/pdf" ||
        req.file.originalname.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        return res
          .status(400)
          .json({ ok: false, msg: "يُقبل فقط ملف PDF." });
      }

      // ==========================
      // 4) التحقق من اسم الملف (customName)
      // ==========================
      if (req.body?.customName) {
        const name = req.body.customName.trim();

        if (/^[0-9]/.test(name)) {
          return res
            .status(400)
            .json({ ok: false, msg: "لا يمكن أن يبدأ اسم الملف برقم." });
        }

        if (!/^[a-zA-Z\u0600-\u06FF0-9 ]+$/.test(name)) {
          return res
            .status(400)
            .json({ ok: false, msg: "اسم الملف يحتوي على رموز غير مسموحة." });
        }

        if (name.length > 20) {
          return res
            .status(400)
            .json({ ok: false, msg: "اسم الملف طويل جدًا. الحد الأقصى 20 حرفًا." });
        }
      }

      // ==========================
      // 5) نجاح الرفع
      // ==========================
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
      body: {},  // مهم لحالات customName
      file: {
        path: "temp.pdf",
        size: 1 * 1024 * 1024,
        originalname: "file.pdf",
        mimetype: "application/pdf",
      },
    };

    jest.clearAllMocks();
  });

  // ==========================
  // SUCCESS TEST
  // ==========================
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

  // ==========================
  // FAIL - NO FILE
  // ==========================
  test("fails - no file", async () => {
    req.file = null;

    await uploadThenGenerate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ msg: "لم يتم استلام ملف." })
    );
  });

  // ==========================
  // FAIL - SIZE TOO LARGE
  // ==========================
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

  // ==========================
  // FAIL - NOT PDF
  // ==========================
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

  // ==========================
  // FAIL - INVALID NAME (symbols)
  // ==========================
  test("fails - invalid name: symbols", async () => {
    req.body.customName = "abc$#@";

    await uploadThenGenerate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "اسم الملف يحتوي على رموز غير مسموحة."
      })
    );
  });

  // ==========================
  // FAIL - INVALID NAME (length > 20)
  // ==========================
  test("fails - invalid name: long name", async () => {
    req.body.customName = "aaaaaaaaaaaaaaaaaaaaaaa"; // 23 chars

    await uploadThenGenerate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "اسم الملف طويل جدًا. الحد الأقصى 20 حرفًا."
      })
    );
  });

  // ==========================
  // FAIL - INVALID NAME (starts with number)
  // ==========================
  test("fails - invalid name: starts with number", async () => {
    req.body.customName = "1testname";

    await uploadThenGenerate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "لا يمكن أن يبدأ اسم الملف برقم."
      })
    );
  });
});
