// server/tests/studySessionController.test.js
const {
  createSession,
  updateSessionStatus,
} = require("../../src/controllers/studySessionController");

// Mock Firestore StudySession collection
jest.mock("../../src/config/firebase-config", () => {
  const add = jest.fn();
  const doc = jest.fn(() => ({
    get: jest.fn(),
    update: jest.fn(),
  }));

  return {
    StudySession: { add, doc },
  };
});

const { StudySession } = require("../../src/config/firebase-config");

describe("Study Session Controller Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    req = { 
      user: { id: "test-user-id" },
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  // ==========================================
  // 1️⃣ createSession Tests
  // ==========================================
  test("createSession success", async () => {
    req.body = { sessionTitle: "Study Math", totalStudyTime: 50 };

    StudySession.add.mockResolvedValueOnce({ id: "new-session-id" });

    await createSession(req, res);

    expect(StudySession.add).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "new-session-id",
        sessionTitle: "Study Math",
      })
    );
  });

  test("createSession unauthorized", async () => {
    req.user = undefined;

    await createSession(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: "غير مصرّح" });
  });

  test("createSession missing title", async () => {
    req.body = {};

    await createSession(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: "اسم الجلسة مطلوب" });
  });

  test("createSession internal error", async () => {
    req.body = { sessionTitle: "Test" };
    StudySession.add.mockRejectedValueOnce(new Error("boom"));

    await createSession(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "خطأ في إنشاء الجلسة",
      })
    );
  });

  // ==========================================
  // 2️⃣ updateSessionStatus Tests
  // ==========================================
  test("updateSessionStatus success", async () => {
    req.params = { id: "session-1" };
    req.body = { status: "completed" };

    const mockGet = jest.fn().mockResolvedValueOnce({
      exists: true,
      data: () => ({ student_ID: "test-user-id" }),
    });

    const mockUpdate = jest.fn().mockResolvedValueOnce();

    StudySession.doc.mockReturnValueOnce({
      get: mockGet,
      update: mockUpdate,
    });

    await updateSessionStatus(req, res);

    expect(mockUpdate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "session-1",
        status: "completed",
      })
    );
  });

  test("updateSessionStatus unauthorized", async () => {
    req.user = undefined;

    await updateSessionStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: "غير مصرّح" });
  });

  test("updateSessionStatus missing id", async () => {
    req.params = {};
    req.body = { status: "paused" };

    await updateSessionStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: "sessionId مطلوب" });
  });

  test("updateSessionStatus missing status", async () => {
    req.params = { id: "abc" };
    req.body = {};

    await updateSessionStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: "status مطلوب" });
  });

  test("updateSessionStatus session not found", async () => {
    req.params = { id: "abc" };
    req.body = { status: "completed" };

    StudySession.doc.mockReturnValueOnce({
      get: jest.fn().mockResolvedValueOnce({ exists: false }),
    });

    await updateSessionStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ msg: "الجلسة غير موجودة" });
  });

  test("updateSessionStatus forbidden", async () => {
    req.params = { id: "abc" };
    req.body = { status: "completed" };

    StudySession.doc.mockReturnValueOnce({
      get: jest.fn().mockResolvedValueOnce({
        exists: true,
        data: () => ({ student_ID: "other-user" }),
      }),
    });

    await updateSessionStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      msg: "غير مصرّح بتحديث هذه الجلسة",
    });
  });

  test("updateSessionStatus internal error", async () => {
    req.params = { id: "abc" };
    req.body = { status: "done" };

    StudySession.doc.mockReturnValueOnce({
      get: jest.fn().mockRejectedValueOnce(new Error("boom")),
    });

    await updateSessionStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "خطأ في تحديث الجلسة",
      })
    );
  });
});
