const express = require("express");
const router = express.Router();
const signups = require("../models/signUpSchema");
const bcrypt = require("bcryptjs");
const authenticate = require("../middleware/authenticate");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const contacts = require("../models/contactusschema");

const keysecret = "kuchbhikuchbhikuchbhikuchbhikuch";

//emailConfig
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "goelvasu17@gmail.com",
    pass: "picvxeeutcmxhrty",
  },
});

//post request when you registered
router.post("/register", async (req, res) => {
  const { username, email, number, password } = req.body;

  if (!username || !email || !number || !password) {
    res.status(404).json("please fill the data");
  }
  try {
    const preuserEmail = await signups.findOne({ email: email });
    const preuserNumber = await signups.findOne({ number: number });
    const preuserName = await signups.findOne({ username: username });

    if (preuserEmail || preuserNumber || preuserName) {
      res.status(404).json("this user is already present");
    } else {
      const newSignUp = new signups({
        username: username,
        email: email,
        number: number,
        password: password,
      });

      //password hashing
      const storeSignup = await newSignUp.save();
      res.status(201).json({ status: 201, storeSignup });
      // console.log(storeSignup);
      // console.log(newSignUp);
    }
  } catch (err) {
    res.status(404).json(err);
    console.log("catched an error during register");
  }
});

//post request when you login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(404).json("please fill the data");
  }
  try {
    const userValid = await signups.findOne({ username: username });
    if (userValid) {
      const isMatch = await bcrypt.compare(password, userValid.password);
      if (!isMatch) {
        console.log("something like password not matching");
        res.status(404).json({ error: "Password is incorrect" });
      } else {
        const token = await userValid.generateAuthtoken();
        // console.log(token);
        res.cookie("usercookie", token, {
          expires: new Date(Date.now() + 3600000),
          httpOnly: true,
        });

        const result = {
          userValid,
          token,
        };
        res.status(201).json({ status: 201, result });
      }
    } else {
      console.log("username not matching");
      res.status(404).json({ error: "username is not used till now.." });
    }
  } catch (error) {}
});

//if you are valid
router.get("/validuser", authenticate, async (req, res) => {
  try {
    const validuserone = await signups.findOne({ _id: req.userid });
    res.status(201).json({ status: 201, validuserone });
  } catch (error) {
    res.status(401).json({ status: 401, validuserone });
  }
});

//when you click logout
router.get("/logout", authenticate, async (req, res) => {
  // console.log("token is: " + req.token);
  // console.log("userid is: " + req.userid);
  // console.log(req.rootuser[0].tokens.length);
  try {
    req.rootuser.tokens = req.rootuser[0].tokens.filter((curelem) => {
      return curelem.token !== req.token;
    });
    // console.log("cookie before: " + usercookie);
    res.clearCookie("usercookie", { path: "/" });
    // console.log("rootuser now is: " + req.rootuser.tokens.length);
    req.rootuser[0].save();
    res.status(201).json({ status: 201, message: "good going" });
  } catch (error) {
    res.status(401).json({ status: 401, message: "not good going" });
  }
});

router.post("/sendpasswordlink", async (req, res) => {
  // console.log(req.body);
  const { email } = req.body;
  if (!email) {
    res.status(401).json({ status: 401, message: "Enter Your Email" });
  }
  try {
    const userfind = await signups.findOne({ email: email });
    // console.log("userfind: " + userfind);
    //generate token for reset password
    const token = jwt.sign({ _id: userfind._id }, keysecret, {
      expiresIn: "120s",
    });
    // console.log("token: " + token);
    const setusertoken = await signups.findByIdAndUpdate(
      { _id: userfind._id },
      { verifytoken: token },
      { new: true }
    );
    // console.log("setusertoken: " + setusertoken);
    if (setusertoken) {
      const mailtopt = {
        from: "goelvasu17@gmail.com",
        to: email,
        subject: "sending email for password reset",
        text: `THIS LINK IS VALID FOR 2 MINUTES http://localhost:3000/forgetpassword/${userfind._id}/${setusertoken.verifytoken}`,
      };
      transporter.sendMail(mailtopt, (err, info) => {
        if (err) {
          console.log("error: ", err);
          res.status(401).json({ status: 401, message: "email not sent" });
        } else {
          console.log("Email sent ", info.response);
          res
            .status(201)
            .json({ status: 201, message: "email sent successfully" });
        }
      });
    }
  } catch (error) {
    res.status(401).json({ status: 401, message: "Invalid User" });
  }
});

router.get("/forgetpassword/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  // console.log(id, token);
  try {
    const validuser = await signups.findOne({ _id: id, verifytoken: token });
    // console.log(validuser);
    const verifyToken = jwt.verify(token, keysecret);
    // console.log(verifyToken);
    if (validuser && verifyToken._id) {
      res.status(201).json({ status: 201, validuser });
    } else {
      res.status(401).json({ status: 401, message: "user not exist" });
    }
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
});

router.post("/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;
  // console.log("password: " + password);
  try {
    const validuser = await signups.findOne({ _id: id, verifytoken: token });
    // console.log("validuser: " + validuser);
    const verifyToken = jwt.verify(token, keysecret);
    // console.log(verifyToken);
    if (validuser && verifyToken._id) {
      const newPassword = await bcrypt.hash(password, 12);
      const setnewpassword = await signups.findByIdAndUpdate(
        { _id: id },
        { password: newPassword }
      );
      // console.log(setnewpassword);
      setnewpassword.save();
      res.status(201).json({ status: 201, setnewpassword });
    } else {
      res.status(401).json({ status: 401, message: "user not exist" });
    }
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
});

//post request contact us
router.post("/contact", async (req, res) => {
  const { username, email, number, place, feedback } = req.body;
  //   console.log(req.body);

  if (!username || !email || !number || !place || !feedback) {
    res.status(404).json("please fill the data");
  }
  try {
    const preuserEmail = await signups.findOne({ email: email });
    const preuserNumber = await signups.findOne({ number: number });
    const preuserName = await signups.findOne({ username: username });

    if (!preuserEmail || !preuserNumber || !preuserName) {
      res.status(404).json("this user is not present");
    } else {
      const newcontact = new contacts({
        username: username,
        email: email,
        number: number,
        place: place,
        feedback: feedback,
      });
      //   newcontact.insert()
      newcontact.save();
      //   console.log("store: " + storecontact);
      res.status(201).json({ status: 201 });
      // console.log(newSignUp);
    }
  } catch (err) {
    res.status(404).json(err);
    console.log("catched an error during register");
  }
});

module.exports = router;
