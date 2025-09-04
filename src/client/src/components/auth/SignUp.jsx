export default function SignUp() {
  return (
    <form className="sign-up-container" action="" method="post">
      <label htmlFor="first_name" className="required">الاسم الاول</label>
      <input required type="text" name="first_name" id="first_name" />

      <label htmlFor="last_name" className="required">اسم العائلة</label>
      <input required type="text" name="last_name" id="last_name" />

      <label htmlFor="email" className="required">البريد الإلكتروني</label>
      <input required type="email" name="email" id="email" />

      <label htmlFor="password" className="required">كلمة المرور</label>
      <input required type="password" name="password" id="password" />

      <input type="submit" value="إنشاء حساب" />
    </form>
  );
}

function validiation(){
    
}