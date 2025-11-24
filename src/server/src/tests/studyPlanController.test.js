// 🟢 1) Mock serviceAccountKey.json
jest.mock("../../src/config/serviceAccountKey.json", () => ({}), { virtual: true });

// 🟢 2) Mock firebase-admin 
jest.mock("firebase-admin", () => {
  const mockAdd = jest.fn();
  const mockDoc = jest.fn(() => ({ id: "mock-task-id" }));
  const mockSet = jest.fn();

  const mockBatch = {
    set: mockSet,
    commit: jest.fn(),
  };

  return {
    apps: [],
    initializeApp: jest.fn(),
    credential: { cert: jest.fn() },

    firestore: () => ({
      collection: jest.fn(() => ({
        add: mockAdd,
        doc: mockDoc,
      })),
      batch: jest.fn(() => mockBatch),
    }),
  };
});

// بعد ما جهزنا كل الـ mocks نجيب الكنترولر الحقيقي
const { createPlan } = require("../../src/controllers/studyPlanController");
const admin = require("firebase-admin");
const db = admin.firestore();

// نحضر الكولكشن للمقارنات
const studyPlansCol = db.collection("study_plans");
const tasksCol = db.collection("tasks");

// 🟣 Start Test Suite
describe("StudyPlan Controller – createPlan", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: "test-user-id" },
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  // 1️⃣ Unauthorized
  test("createPlan unauthorized (no req.user)", async () => {
    req.user = undefined;

    await createPlan(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: "غير مصرّح بالدخول" });
  });

  // 2️⃣ Missing title
  test("createPlan missing title", async () => {
    req.body = { tasks: [] };

    await createPlan(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: "العنوان مطلوب" });
  });

  // 3️⃣ Success (no tasks)
  test("createPlan success without tasks", async () => {
    req.body = {
      title: "My Study Plan",
      tasks: [],
    };

    // mock response from Firestore
    studyPlansCol.add.mockResolvedValueOnce({ id: "plan123" });

    await createPlan(req, res);

    expect(studyPlansCol.add).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      msg: "✅ تم حفظ الخطة بنجاح",
      planId: "plan123",
      ownerId: "test-user-id",
    });
  });

  // 4️⃣ Success (with tasks + batch)
  test("createPlan success with tasks", async () => {
    req.body = {
      title: "Plan With Tasks",
      tasks: [
        { title: "Task A", priority: "عالية", deadline: "2025-01-01" },
        { title: "Task B" },
      ],
    };

    studyPlansCol.add.mockResolvedValueOnce({ id: "planABC" });

    const batch = db.batch();
    const commitSpy = jest.spyOn(batch, "commit").mockResolvedValueOnce();

    await createPlan(req, res);

    expect(studyPlansCol.add).toHaveBeenCalled();
    expect(commitSpy).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      msg: "✅ تم حفظ الخطة بنجاح",
      planId: "planABC",
      ownerId: "test-user-id",
    });
  });

  // 5️⃣ Internal Error
  test("createPlan internal error", async () => {
    req.body = {
      title: "Error Plan",
      tasks: [],
    };

    studyPlansCol.add.mockRejectedValueOnce(new Error("boom!"));

    await createPlan(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        msg: "فشل في حفظ الخطة",
      })
    );
  });
});
