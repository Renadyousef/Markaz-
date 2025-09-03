export default function LandingHeader() {
  return (
    <nav className="navbar navbar-expand-lg shadow-sm ">
      <div className="container-fluid">
        {/* Logo */}
        <a className="navbar-brand" href="#">
          <img src="/logo.png" alt="Logo" className="img-fluid" style={{ maxHeight: '70px' }} />
        </a>

        {/* Hamburger menu for mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarButtons"
          aria-controls="navbarButtons"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Buttons */}
        <div className="collapse navbar-collapse justify-content-end" id="navbarButtons">
          <div className="d-flex">
            <a className="btn custom-signin ms-2" href="/signin">
              تسجيل الدخول
            </a>
            <a className="btn custom-signup" href="/signup">
              إنشاء حساب
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
