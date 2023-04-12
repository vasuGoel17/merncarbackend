const express = require("express");
const router = express.Router();
const multer = require("multer");
const { createCanvas, loadImage } = require("canvas");
const bcrypt = require("bcryptjs");
const authenticate = require("../middleware/authenticate");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const users = require("../models/userSchema");
const signups = require("../models/signUpSchema");
const contacts = require("../models/contactusschema");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
const keysecret = process.env.KEYSECRET;

//emailConfig
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER,
    pass: process.env.PASS,
  },
});

router.post("/api/sendpasswordlink", async (req, res) => {
  // console.log(req.body);
  console.log("hello therer:");
  const email = req.body.email;
  if (!email) {
    res.status(401).json({ status: 401, message: "Enter Your Email" });
  }
  try {
    console.log("hello there: " + email);
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
    console.log("okokokok");
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
          res
            .status(401)
            .json({ status: 401, message: "email not sent", error: err });
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

//post request when you registered
router.post("/api/register", async (req, res) => {
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

      const newuser = new users({
        username: username,
      });

      //password hashing
      const storeSignup = await newSignUp.save();
      const storeuser = await newuser.save();
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
router.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(404).json("please fill the data");
  }
  try {
    console.log("Aaya");
    const userValid = await signups.findOne({ username: username });
    if (userValid) {
      const isMatch = await bcrypt.compare(password, userValid.password);
      console.log("yaha Aaya");
      if (!isMatch) {
        console.log("something like password not matching");
        res.status(404).json({ error: "Password is incorrect" });
      } else {
        console.log("yaha bhi Aaya");
        // const token = await userValid.generateAuthtoken();
        // // console.log(token);
        // res.cookie("usercookie", token, {
        //   expires: new Date(Date.now() + 3600000),
        //   httpOnly: true,
        // });
        // const result = {
        //   userValid,
        //   token,
        // };
        // result
        res.status(201).json({ status: 201 });
      }
    } else {
      console.log("username not matching");
      res.status(404).json({ error: "username is not used till now.." });
    }
  } catch (error) {}
});

//if you are valid
router.get("/api/validuser", authenticate, async (req, res) => {
  try {
    const validuserone = await signups.findOne({ _id: req.userid });
    res.status(201).json({ status: 201, validuserone });
  } catch (error) {
    res.status(401).json({ status: 401, validuserone });
  }
});

//when you click logout
router.get("/api/logout", authenticate, async (req, res) => {
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

router.get("/api/forgetpassword/:id/:token", async (req, res) => {
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

router.post("/api/:id/:token", async (req, res) => {
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
router.post("/api/contact", async (req, res) => {
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
      // xssssssssssssssssssscccccccsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss
      // xssssssssssssssssssscccccccsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss
      // xssssssssssssssssssscccccccsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss

      const preuser = await contacts.findOne({ email: email });
      if (preuser) {
        // console.log("baad me");
        const add = await contacts.updateMany(
          { email: email },
          { $push: { feedbacks: feedback } }
        ); // add "Sports" element
        console.log(add);
      } else {
        const newcontact = new contacts({
          username: username,
          email: email,
          number: number,
          place: place,
          feedbacks: feedback,
        });
        //   newcontact.insert()
        newcontact.save();
        //   console.log("store: " + storecontact);
        res.status(201).json({ status: 201 });
      }

      // xssssssssssssssssssscccccccsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss
      // xssssssssssssssssssscccccccsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss
      // xssssssssssssssssssscccccccsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss
    }
  } catch (err) {
    res.status(404).json(err);
    console.log("catched an error during register");
  }
});

router.post("/api/imgreg", upload.single("image"), async (req, res) => {
  console.log(122);
  console.log(req.file);
  console.log(req.body);
  try {
    const username = req.body.username;
    const imageurl = req.file.path;
    if (!imageurl) {
      return res.send({ status: 400, message: "bad request" });
    }

    let img = `https://merncarbackend.onrender.com/${imageurl}`;
    console.log("img: ", img);

    let parts = [];
    console.log("hhhhhh", parts.length);

    await loadImage(img).then((img) => {
      const canvas = createCanvas(img.width / 3, img.height / 3);
      const ctx = canvas.getContext("2d");
      ctx.moveTo(0, 0);
      let w2 = img.width / 3;
      let h2 = img.height / 3;
      console.log("w2: ", w2, "h2: ", h2);
      for (let i = 0; i < 9; i++) {
        let x = (-w2 * i) % (w2 * 3);
        let y;
        if ((h2 * i) / h2 <= 2) {
          y = 0;
        } else if ((h2 * i) / h2 <= 5 && (h2 * i) / h2 > 2) {
          y = -h2 * 1;
        } else {
          y = -h2 * 2;
        }
        console.log("x: ", x, "y: ", y);
        canvas.width = w2;
        canvas.height = h2;
        ctx.drawImage(img, x, y, w2 * 3, h2 * 3);
        parts.push(canvas.toDataURL());
        console.log("i: ", i);
        // console.log("parts[i]: ", parts[i]);
        add(i, parts[i], username, imageurl);
      }
    });

    console.log("ddddddddddd:  ");
    console.log("add: ", add);
    return res.send({ status: 200, message: "good request" });
  } catch (error) {}
});

router.post("/api/getuser", async (req, res) => {
  try {
    const { username } = req.body;
    const requser = await users.findOne({ username: username });
    console.log("hanji user: ", username);

    res.send({ status: "ok", data: requser });
  } catch (error) {
    console.log(error);
  }
});

router.post("/api/imglogin", async (req, res) => {
  const { username } = req.body;
  const userValid = await signups.findOne({ username: username });
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
});

const add = async (i, parts, username, imageurl) => {
  console.log("aa: ", i);
  await users.updateMany(
    { username: username },
    {
      $set: {
        imageurl: imageurl,
      },
      $push: {
        imgsegment: { imgg: parts, num: i },
      },
    }
  );
};

const change = async (i, parts, username, imageurl) => {
  console.log("aa: ", i);
  await users.updateOne(
    { username: username, "imgsegment.num": i },
    {
      $set: {
        "imgsegment.$.imgg": parts,
        imageurl: imageurl,
      },
    }
  );
};

router.post("/api/changeimg", upload.single("image"), async (req, res) => {
  console.log(1);
  console.log(req.body);
  console.log(req.file);
  const { password, username } = req.body;
  if (!password || !username) {
    res.status(404).json("please fill the data");
  }
  try {
    const userValid = await signups.findOne({ username: username });
    if (userValid) {
      const isMatch = await bcrypt.compare(password, userValid.password);
      console.log("yaha Aaya");
      if (!isMatch) {
        console.log("something like password not matching");
        res.status(404).json({ error: "Password is incorrect" });
      } else {
        console.log("yaha bhi Aaya");
        const imageurl = req.file.path;
        if (!imageurl) {
          return res.send({ status: 400, message: "bad request" });
        }
        let img = `https://merncarbackend.onrender.com/${imageurl}`;
        console.log("img: ", img);
        let parts = [];
        console.log("hhhhhh", parts.length);
        await loadImage(img).then((img) => {
          const canvas = createCanvas(img.width / 3, img.height / 3);
          const ctx = canvas.getContext("2d");
          ctx.moveTo(0, 0);
          let w2 = img.width / 3;
          let h2 = img.height / 3;
          console.log("w2: ", w2, "h2: ", h2);
          for (let i = 0; i < 9; i++) {
            let x = (-w2 * i) % (w2 * 3);
            let y;
            if ((h2 * i) / h2 <= 2) {
              y = 0;
            } else if ((h2 * i) / h2 <= 5 && (h2 * i) / h2 > 2) {
              y = -h2 * 1;
            } else {
              y = -h2 * 2;
            }
            console.log("x: ", x, "y: ", y);
            canvas.width = w2;
            canvas.height = h2;
            ctx.drawImage(img, x, y, w2 * 3, h2 * 3);
            parts.push(canvas.toDataURL());
            console.log("i: ", i);
            // console.log("parts[i]: ", imageurl);
            // console.log("parts ", username);
            change(i, parts[i], username, imageurl);
            console.log("ddddddddddd:  ");
            console.log("add: ", change);
          }
          return res.send({ status: 200, message: "good request" });
        });
        res.status(201).json({ status: 201 });
      }
    } else {
      console.log("username not matching");
      res.status(404).json({ error: "username is not used till now.." });
    }
  } catch (error) {}
});

module.exports = router;
