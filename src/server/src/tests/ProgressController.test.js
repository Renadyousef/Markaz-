/**
 * FINAL UNIT TEST – ProgressController
 */

const mockDB = require("./mockFirebase");

// ================= FIREBASE MOCK =================
jest.mock("firebase-admin", () => {
  // إنشاء mock للـ firestore function
  const mockFirestore = jest.fn(() => mockDB);

  // إضافة Timestamp داخل نفس المفتاح
  mockFirestore.Timestamp = {
    now: () => ({
      toDate: () => new Date("2025-11-16T21:20:24"),
    }),
  };

  return {
    firestore: mockFirestore,
    initializeApp: jest.fn(),
  };
});


// ================= IMPORT CONTROLLER =================
const { getProgress, getProgressHistory } = require("../controllers/progressController");

describe("Progress Controller — FINAL WORKING TESTS", () => {

  let req, res;

  beforeEach(() => {
    req = {
      user: { id: "user123" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  // ===================== SUCCESS – getProgress =====================
  test("getProgress success", async () => {
    const today = new Date().toISOString().slice(0, 10);

    mockDB.collection.mockImplementation((name) => {
      if (name === "tasks") {
        return {
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({
            size: 2,
            docs: [
              { data: () => ({ completed: true }) },
              { data: () => ({ completed: false }) },
            ],
          }),
        };
      }

      if (name === "study_session") {
        return {
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({
            docs: [
              {
                data: () => ({
                  createdAt: new Date(today + "T10:00:00"),
                }),
              },
            ],
          }),
        };
      }

      if (name === "quiz_result") {
        return {
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({
            docs: [
              { data: () => ({ score: 90 }) },
              { data: () => ({ score: 80 }) },
            ],
          }),
        };
      }

      if (name === "progress") {
        return {
          doc: jest.fn().mockReturnThis(),
          set: jest.fn().mockResolvedValue(true),
        };
      }
    });

    await getProgress(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        totalTasks: 2,
        completedTasks: 1,
        sessionsToday: 1,
        improvement: 10,
      })
    );
  });

  // ===================== UNAUTHORIZED =====================
  test("getProgress unauthorized", async () => {
    req.user = null;

    await getProgress(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: "Unauthorized: Missing user ID",
    });
  });

  // ===================== INTERNAL ERROR =====================
  test("getProgress internal error", async () => {
    mockDB.collection.mockImplementation(() => {
      throw new Error("boom");
    });

    await getProgress(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "boom" })
    );
  });

  // ===================== HISTORY SUCCESS =====================
  test("getProgressHistory success", async () => {
    mockDB.collection.mockImplementation(() => {
      return {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          docs: [
  { data: () => ({ date: "2025-01-01", percent: 40 }) },
  { data: () => ({ date: "2025-01-02", percent: 80 }) },
],

        }),
      };
    });

    await getProgressHistory(req, res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      data: [
  { date: "2025-01-02", percent: 80 },
  { date: "2025-01-01", percent: 40 },
],

    });
  });

  // ===================== MISSING INDEX =====================
  test("getProgressHistory missing index", async () => {
    mockDB.collection.mockImplementation(() => {
      return {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockRejectedValue({ code: 9 }),
      };
    });

    await getProgressHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ===================== INTERNAL ERROR =====================
  test("getProgressHistory internal error", async () => {
    mockDB.collection.mockImplementation(() => {
      return {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockRejectedValue(new Error("boom")),
      };
    });

    await getProgressHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "boom" })
    );
  });
});
