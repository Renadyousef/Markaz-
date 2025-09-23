const { signup, login } = require("../controllers/authController");

describe("Auth Controller test cases for unit testing", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  //Signup

  // 1:Test case: Signup with valid new user data
  test("signup success", async () => {
    const uniqueEmail = `testuser_${Date.now()}@test.com`; // unique email for each run
    req.body = { firstName: "ريناد", lastName: "العتيبي", email: uniqueEmail, password: "Roo@091091" };

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      msg: "تم إنشاء الحساب بنجاح",
      token: expect.any(String) // token generated dynamically
    }));
  });

  // 2:Test case: Signup with an already existing email
  test("signup with existing email", async () => {
    const existingEmail = "renadroo017@gmail.com"; // ensure this email already exists in DB
    req.body = { firstName: "سارة", lastName: "العتيبي", email: existingEmail, password: "Roo@711711" };

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: "البريد الإلكتروني مستخدم مسبقًا" });
  });

  //Login

  // 3.Test case: Login with correct email and password
  test("login success", async () => {
    const email = "renadroo017@gmail.com"; 
    const password = "Roo@711711";       
    req.body = { email, password };

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      msg: "تم تسجيل الدخول بنجاح",
      token: expect.any(String)
    }));
  });

  //4. Test case: Login with wrong password
  test("login with wrong password", async () => {
    req.body = { email: "renadroo017@gmail.com", password: "Roo@311311" };

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: "البريد الالكتروني او كلمة المرور غير صحيحة" });
  });

  // Test case: Login with non-existing user
  test("login with non-existing user", async () => {
    const email = `nonexist_${Date.now()}@test.com`; // unique non-existent email
    req.body = { email, password: "Roo@311311" };

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ msg: "المستخدم غير موجود" });
  });
});
