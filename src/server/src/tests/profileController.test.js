// server/tests/profileController.test.js
const { getMe, updateMe } = require("../../src/controllers/profileController");

// Mock Firestore Students collecion used by the controller
jest.mock("../../src/config/firebase-config", () => {
  const get = jest.fn();
  const update = jest.fn();
  return {
    Students: { doc: jest.fn(() => ({ get, update })) },
  };
});

const { Students } = require("../../src/config/firebase-config");
const mockGet = Students.doc().get;
const mockUpdate = Students.doc().update;

describe("Profile Controller test cases for unit testing", () => {
  let req, res;

  beforeEach(() => {
    req = { user: { id: "test-user-id" }, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });


  // 1) Success
  test("getMe success", async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        firstName: "رناد",
        lastName: "العتيبي",
        email: "renadroo017@gmail.com",
      }),
    });

    await getMe(req, res);

    expect(Students.doc).toHaveBeenCalledWith("test-user-id");
    expect(mockGet).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      firstName: "رناد",
      lastName: "العتيبي",
      email: "renadroo017@gmail.com",
    });
  });

  // 2) Unauthorized (no req.user)
  test("getMe unauthorized (no token/user)", async () => {
    req.user = undefined;

    await getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: "غير مصرّح" });
  });

  // 3) Not found
  test("getMe user not found", async () => {
    mockGet.mockResolvedValueOnce({ exists: false });

    await getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ msg: "المستخدم غير موجود" });
  });

  // 4) Internal error path
  test("getMe internal error", async () => {
    mockGet.mockRejectedValueOnce(new Error("boom"));

    await getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ msg: "تعذّر جلب البيانات" })
    );
  });

  // ---------- PUT /profile/me ----------

  // 5) Success
  test("updateMe success", async () => {
    req.body = { firstName: "سارة", lastName: "العتيبي" };
    mockUpdate.mockResolvedValueOnce();

    await updateMe(req, res);

    expect(Students.doc).toHaveBeenCalledWith("test-user-id");
    expect(mockUpdate).toHaveBeenCalledWith({
      firstName: "سارة",
      lastName: "العتيبي",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ msg: "تم التحديث بنجاح" });
  });

  // 6) Unauthorized
  test("updateMe unauthorized", async () => {
    req.user = undefined;

    await updateMe(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: "غير مصرّح" });
  });

  // 7) Invalid input types
  test("updateMe invalid inputs (types)", async () => {
    req.body = { firstName: 123, lastName: null };

    await updateMe(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: "مدخلات غير صالحة" });
  });

  // 8) Too short names
  test("updateMe invalid inputs (length < 2)", async () => {
    req.body = { firstName: "أ", lastName: "ب" };

    await updateMe(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      msg: "الاسم الأول واسم العائلة يجب ألا يقلّا عن حرفين",
    });
  });

  // 9) Internal error path
  test("updateMe internal error", async () => {
    req.body = { firstName: "سارة", lastName: "العتيبي" };
    mockUpdate.mockRejectedValueOnce(new Error("boom"));

    await updateMe(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ msg: "تعذّر تحديث البيانات" })
    );
  });
});
