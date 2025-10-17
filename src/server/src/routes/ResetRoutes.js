const express = require("express"); 
const { forgotPassword, resetPassword } = require("../controllers/resetController");//the
const router = express.Router();


router.post("/forgot-password", forgotPassword);///auth/forgot-password
router.post("/reset-password", resetPassword);


module.exports = router;
