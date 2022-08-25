const express = require("express");
const router = express.Router();
const User = require("../models/schema");
const bcrypt = require("bcrypt");
const authenticate = require("../middlewares/authenticate");
const { encrypt, decrypt } = require("../models/EncDecManager");
const hibp = require("haveibeenpwned")();
const https = require("https");
const crypto = require("crypto");

router.post("/register", async (req, res) => {
  const { name, email, password, cpassword } = req.body;

  if (!name || !email || !password || !cpassword) {
    return res.status(400).json({ error: "Invalid Credentials" });
  } else {
    if (password === cpassword) {
      try {
        const result = await User.findOne({ email: email });

        if (result) {
          return res.status(400).json({ error: "Email already exists." });
        }

        const newUser = new User({ name, email, password });

        await newUser.save();

        return res.status(201).json({ message: "User created succressfully." });
      } catch (error) {
        console.log(error);
      }
    } else {
      return res.status(400).json({ error: "Invalid Credentials." });
    }
  }

  res.json({
    error: "There was an internal error. Sorry for the inconvience.",
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Please fill all the fields." });
  }

  try {
    const emailExist = await User.findOne({ email: email });

    if (!emailExist) {
      return res.status(400).json({ error: "Invalid Credentials." });
    }

    const isMatch = await bcrypt.compare(password, emailExist.password);

    const token = await emailExist.generateAuthToken();

    if (isMatch) {
      res.cookie("jwtoken", token, {
        expires: new Date(Date.now() + 2592000000),
        httpOnly: true,
      });

      return res.status(200).json({ message: "User login successfully." });
    } else {
      return res.status(400).json({ error: "Invalid Credentials" });
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/authenticate", authenticate, async (req, res) => {
  res.send(req.rootUser);
});

router.post("/addnewpassword", authenticate, async (req, res) => {
  const { platform, userPass, userEmail, platEmail } = req.body;

  if (!platform || !userPass || !userEmail || !platEmail) {
    return res.status(400).json({ error: "Please fill the form properly" });
  }

  try {
    const rootUser = req.rootUser;

    //const algo = rootUser.algo;

    const { iv, encryptedPassword } = encrypt(userPass);

    const isSaved = await rootUser.addNewPassword(
      encryptedPassword,
      iv,
      platform,
      platEmail
    );

    if (isSaved) {
      return res
        .status(200)
        .json({ message: "Successfully added your password." });
    } else {
      return res.status(400).json({ error: "Could not save the password." });
    }
  } catch (error) {
    console.log(error);
  }

  return res.status(400).json({ error: "An unknown error occured." });
});

router.post("/deletepassword", authenticate, async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Could not find data" });
  }

  try {
    const rootUser = req.rootUser;

    const isDeleted = await User.updateOne(
      { email: rootUser.email },
      { $pull: { passwords: { _id: id } } }
    );

    if (!isDeleted) {
      return res.status(400).json({ error: "Could not delete the password." });
    }

    return res
      .status(200)
      .json({ message: "Successfully deleted your password." });
  } catch (err) {
    console.log(err);
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("jwtoken", { path: "/" });
  res.status(200).send("Logout");
});

router.post("/decrypt", authenticate, (req, res) => {
  const { iv, encryptedPassword } = req.body;

  const rootUser = req.rootUser;

  //const algo = rootUser.algo;

  return res.status(200).send(decrypt(encryptedPassword, iv));
});

router.post("/breach", authenticate, (req, resp) => {
  const { iv, encryptedPassword } = req.body;
  const rootUser = req.rootUser;
  //const algo = rootUser.algo;

  const breachPassword = decrypt(encryptedPassword, iv);

  let hashedPassword = crypto
    .createHash("sha1")
    .update(breachPassword)
    .digest("hex")
    .toUpperCase();

  let prefix = hashedPassword.slice(0, 5);
  let apiCall = `https://api.pwnedpasswords.com/range/${prefix}`;

  let hashes = "";
  https
    .get(apiCall, function (res) {
      res.setEncoding("utf8");
      res.on("data", (chunk) => (hashes += chunk));
      res.on("end", onEnd);
    })
    .on("error", function (err) {
      console.error(`Error: ${err}`);
    });

  function onEnd() {
    let res = hashes.split("\r\n").map((h) => {
      let sp = h.split(":");
      return {
        hash: prefix + sp[0],
        count: parseInt(sp[1]),
      };
    });

    let found = res.find((h) => h.hash === hashedPassword);
    if (found) {
      return resp.status(200).json({
        message: `Found ${found.count} matches! Password vulnerable!`,
      });
    } else {
      return resp.status(201).json({
        message: "No matches found!",
      });
    }
  }
});

module.exports = router;
