export default function SignIn() {
  return (
    <form className="sign-up-container" action="" method="post">
      <label htmlFor="email" className="required">البريد الإلكتروني </label>
      <input required type="email" name="email" id="email" />

      <label htmlFor="password" className="required">كلمة المرور </label>
      <input required type="password" name="password" id="password" />

      <input type="submit" value="تسجيل الدخول" />
    </form>
  );
}
