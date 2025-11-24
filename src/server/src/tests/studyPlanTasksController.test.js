// server/tests/studyPlanTasksController.test.js

// Mock serviceAccountKey.json
jest.mock("../config/serviceAccountKey.json", () => ({}), { virtual: true });

// Mock firebase-admin (FieldValue is STATIC under admin.firestore)
jest.mock("firebase-admin", () => {
  const get = jest.fn();
  const set = jest.fn();
  const update = jest.fn();
  const del = jest.fn();

  const doc = jest.fn(() => ({ get, set, update, delete: del }));
  const where = jest.fn(() => ({ get }));
  const collection = jest.fn(() => ({ doc, where }));

  // FieldValue STATIC
  const FieldValue = {
    increment: jest.fn(() => "inc"),
    serverTimestamp: jest.fn(() => "ts"),
  };

  const adminMock = {
    apps: [],
    initializeApp: jest.fn(),
    credential: { cert: jest.fn() },

    firestore: () => ({
      collection,
      runTransaction: jest.fn((fn) => fn({ set, update, delete: del })),
    }),
  };

  adminMock.firestore.FieldValue = FieldValue;
  return adminMock;
});

// Import controller
const {
  getPlanMeta,
  createTask,
  updateTask,
  deleteTask,
} = require("../../src/controllers/studyPlanTasksController");

const admin = require("firebase-admin");
const db = admin.firestore();
const PlansCol = db.collection("study_plans");
const TasksCol = db.collection("tasks");

const mockPlanDoc = PlansCol.doc();
const mockPlanGet = mockPlanDoc.get;

const mockTaskDoc = TasksCol.doc();
const mockTaskGet = mockTaskDoc.get;

// ======================================================
// TEST SUITE
// ======================================================
describe("StudyPlanTasksController Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    req = { user: { id: "user123" }, params: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  // =============================== GET PLAN META ===============================
  test("getPlanMeta success", async () => {
    req.params.planId = "1";
    mockPlanGet.mockResolvedValueOnce({
      exists: true,
      id: "1",
      data: () => ({ title: "Plan", ownerId: "user123", tasksCount: 3 }),
    });

    await getPlanMeta(req, res);

    expect(res.json).toHaveBeenCalledWith({
      id: "1",
      title: "Plan",
      ownerId: "user123",
      createdAt: null,
      tasksCount: 3,
    });
  });

  test("getPlanMeta unauthorized", async () => {
    req.user = undefined;
    await getPlanMeta(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("getPlanMeta missing planId", async () => {
    await getPlanMeta(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("getPlanMeta not found", async () => {
    req.params.planId = "1";
    mockPlanGet.mockResolvedValueOnce({ exists: false });

    await getPlanMeta(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("getPlanMeta internal error", async () => {
    req.params.planId = "1";
    mockPlanGet.mockRejectedValueOnce(new Error("boom"));

    await getPlanMeta(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  // =============================== CREATE TASK ===============================

  test("createTask success", async () => {
    req.user = { id: "user123" };
    req.params.planId = "1";
    req.body = { title: "Task" };

    mockPlanGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ ownerId: "user123" }),
    });

    await createTask(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("createTask unauthorized", async () => {
    req.user = undefined;
    await createTask(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("createTask missing planId", async () => {
    req.user = { id: "user123" };
    req.body = { title: "Task" };
    await createTask(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("createTask missing title", async () => {
    req.params.planId = "1";
    req.body = {};
    await createTask(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("createTask internal error only", async () => {
    req.params.planId = "1";
    req.body = { title: "Task" };

    mockPlanGet.mockRejectedValueOnce(new Error("boom"));

    await createTask(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  // =============================== UPDATE TASK ===============================
  test("updateTask success", async () => {
    req.params = { planId: "1", taskId: "10" };
    req.body = { title: "Updated" };

    mockTaskGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ ownerId: "user123", studyPlan_ID: "1" }),
    });

    await updateTask(req, res);

    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  test("updateTask unauthorized", async () => {
    req.user = undefined;
    await updateTask(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("updateTask task not found", async () => {
    req.params = { planId: "1", taskId: "10" };
    mockTaskGet.mockResolvedValueOnce({ exists: false });

    await updateTask(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("updateTask no fields", async () => {
    req.params = { planId: "1", taskId: "10" };
    req.body = {};

    mockTaskGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ ownerId: "user123", studyPlan_ID: "1" }),
    });

    await updateTask(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("updateTask internal error", async () => {
    req.params = { planId: "1", taskId: "10" };
    req.body = { title: "Updated" };

    mockTaskGet.mockRejectedValueOnce(new Error("boom"));

    await updateTask(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  // =============================== DELETE TASK ===============================
  test("deleteTask success", async () => {
    req.params = { planId: "1", taskId: "10" };

    mockPlanGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ ownerId: "user123" }),
    });

    mockTaskGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ ownerId: "user123", studyPlan_ID: "1" }),
    });

    await deleteTask(req, res);

    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  test("deleteTask unauthorized", async () => {
    req.user = undefined;
    await deleteTask(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("deleteTask task not found", async () => {
    req.params = { planId: "1", taskId: "10" };

    mockPlanGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ ownerId: "user123" }),
    });

    mockTaskGet.mockResolvedValueOnce({ exists: false });

    await deleteTask(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("deleteTask internal error", async () => {
    req.params = { planId: "1", taskId: "10" };

    mockPlanGet.mockRejectedValueOnce(new Error("boom"));

    await deleteTask(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
