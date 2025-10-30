// src/client/src/components/landingPage/LandingHeader.jsx
import { Navbar, Container, Button } from "react-bootstrap";
import "./header.css";

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

      
      </Container>
    </Navbar>
  );
}