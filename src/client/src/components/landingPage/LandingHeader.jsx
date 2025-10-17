// src/client/src/components/landingPage/LandingHeader.jsx
import { Navbar, Container, Button } from "react-bootstrap";
import "./landing.css";

export default function LandingHeader({ goTo }) {
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
      <Container fluid className="d-flex justify-content-between align-items-center">
        {/* Logo */}
        <Navbar.Brand href="#">
          <img
            src="/logo3.svg"
            alt="شعار مركز"
            style={{ height: "60px", width: "auto" }}
          />
        </Navbar.Brand>

        {/* Start button */}
        <Button
          variant="warning"
          className="fw-bold px-4"
          style={{ backgroundColor: "#ff914d", border: "none", color: "#ffffff" }}
          onClick={() => goTo?.("auth", "signin")} // ✅ use your App's goTo
        >
          ابدا الان
        </Button>
      </Container>
    </Navbar>
  );
}