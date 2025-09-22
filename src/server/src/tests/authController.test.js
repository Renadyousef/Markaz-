// Mocks must come first
jest.mock("../config/firebase-config", () => ({
  Students: {
    where: jest.fn(() => ({ get: jest.fn() })), // Fixed to mock .get()
    add: jest.fn(),
  },
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

// Import after mocks
const { signup, login } = require("../controllers/authController");
const { Students } = require("../config/firebase-config");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Helper to mock Firestore snapshot
const makeSnapshot = (docsArray) => ({
  empty: docsArray.length === 0,
  docs: docsArray.map((data, index) => ({
    id: `doc-${index}`,
    data: () => data,
  })),
});

describe("Auth Controller", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  // ===== Signup =====
  test("signup success", async () => {
    req.body = { firstName: "John", lastName: "Doe", email: "a@b.com", password: "12345678" };

    // No existing user
    Students.where().get.mockResolvedValueOnce(makeSnapshot([]));
    // Hash password
    bcrypt.hash.mockResolvedValueOnce("hashedPassword");
    // Add user
    Students.add.mockResolvedValueOnce();
    // After add: return new user
    Students.where().get.mockResolvedValueOnce(makeSnapshot([{ email: "a@b.com" }]));
    // JWT token
    jwt.sign.mockReturnValueOnce("fakeToken");

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ msg: "تم إنشاء الحساب بنجاح", token: "fakeToken" });
  });

  test("signup with existing email", async () => {
    req.body = { firstName: "John", lastName: "Doe", email: "a@b.com", password: "12345678" };

    Students.where().get.mockResolvedValueOnce(makeSnapshot([{ email: "a@b.com" }]));

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: "البريد الإلكتروني مستخدم مسبقًا" });
  });

  // ===== Login =====
  test("login success", async () => {
    req.body = { email: "a@b.com", password: "12345678" };

    Students.where().get.mockResolvedValueOnce(makeSnapshot([{ email: "a@b.com", password: "hashedPassword" }]));
    bcrypt.compare.mockResolvedValueOnce(true);
    jwt.sign.mockReturnValueOnce("fakeToken");

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ msg: "تم تسجيل الدخول بنجاح", token: "fakeToken" });
  });

  test("login with wrong password", async () => {
    req.body = { email: "a@b.com", password: "wrong" };

    Students.where().get.mockResolvedValueOnce(makeSnapshot([{ email: "a@b.com", password: "hashedPassword" }]));
    bcrypt.compare.mockResolvedValueOnce(false);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: "البريد الالكتروني او كلمة المرور غير صحيحة" });
  });

  test("login with non-existing user", async () => {
    req.body = { email: "a@b.com", password: "12345678" };

    Students.where().get.mockResolvedValueOnce(makeSnapshot([]));

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ msg: "المستخدم غير موجود" });
  });
});
