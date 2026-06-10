const express = require("express");
const router = express.Router();
const { registerUser } = require("../controllers/userController");
const { authUser } = require("../controllers/userController");
const { allUsers } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").post(registerUser).get(protect,allUsers);
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