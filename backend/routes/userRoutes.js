const express = require("express");
const router = express.Router();
const { registerUser } = require("../controllers/userController");
const { authUser } = require("../controllers/userController");

router.route("/").post(registerUser);
router.route("/login").post(authUser);

// router.route("/").get((req, res) => {
//     res.send("Hello World");
// };

// router.route("/login").post((req, res) => {
//     res.send("Login Route");
// }
// router.route("/register").post((req, res) => {
//     res.send("Register Route");
// }

module.exports = router;