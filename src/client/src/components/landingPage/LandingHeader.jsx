// src/client/src/components/landingPage/LandingHeader.jsx
import { Navbar, Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./landing.css";

export default function LandingHeader({ goTo }) {
  const navigate = useNavigate();

  const handleStart = () => {
    if (goTo) {
      // السلوك الأصلي في صفحة اللاندنق العامة
      goTo("auth", "signin");
    } else {
      // الصفحات: About / Privacy / Contact
      // 🔥 يودّي إلى صفحة التطبيق الأساسية (Landing داخل التطبيق)
      navigate("/landing"); // عدّلي المسار حسب تطبيقك
    }
  };

  return (
    <Navbar
      fixed="top"
      expand={false}
      className="shadow-sm custom-navbar"
      style={{
        background: "#fff3e69f",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Container
        fluid
        className="d-flex justify-content-between align-items-center"
      >
        <Navbar.Brand href="#">
          <img
            src="/logo3.svg"
            alt="شعار مركز"
            style={{ height: "60px", width: "auto" }}
          />
        </Navbar.Brand>

        <Button
          variant="warning"
          className="fw-bold px-4"
          style={{
            backgroundColor: "#ff914d",
            border: "none",
            color: "#ffffff",
          }}
          onClick={handleStart}
        >
          ابدا الان
        </Button>
      </Container>
    </Navbar>
  );
}
