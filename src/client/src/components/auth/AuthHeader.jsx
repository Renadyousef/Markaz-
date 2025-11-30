// src/client/src/components/landingPage/LandingHeader.jsx
import { Navbar, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./header.css";

export default function LandingHeader() {
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
        {/* Logo يودّي للصفحة الرئيسية بالراوتر، مو href */}
        <Navbar.Brand as={Link} to="/">
          <img
            src="/logo3.svg"
            alt="شعار مركز"
            style={{ height: "60px", width: "auto", cursor: "pointer" }}
          />
        </Navbar.Brand>

        {/* تقدرين تضيفين هنا أزرار/روابط ثانية إذا حبيتي بعدين */}
      </Container>
    </Navbar>
  );
}
