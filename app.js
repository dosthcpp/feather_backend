require("dotenv").config();
const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const crypto = require("crypto");
const cache = require("memory-cache");
const request = require("request");
const CryptoJS = require("crypto-js");
const SHA256 = require("crypto-js/sha256");
const Base64 = require("crypto-js/enc-base64");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
const mongoose = require("mongoose");
const User = require("./models/user");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());
mongoose.Promise = global.Promise;
app.use(cors());
const router = express.Router();
router.post("/send", (req, res) => {
  const { phoneNumber, countryCode } = req.body;

  const date = Date.now().toString();
  const uri = "ncp:sms:kr:261426550999:feather";
  const secretKey = "hgoeVr10WAkpwDe1ZgvnO4eX7EhUKukdKre6dDuj";
  const accessKey = "rIRf6KK05kXcF40PKwCM";
  const method = "POST";
  const space = " ";
  const newLine = "\n";
  const url = `https://sens.apigw.ntruss.com/sms/v2/services/${uri}/messages`;
  const url2 = `/sms/v2/services/${uri}/messages`;

  const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);

  hmac.update(method);
  hmac.update(space);
  hmac.update(url2);
  hmac.update(newLine);
  hmac.update(date);
  hmac.update(newLine);
  hmac.update(accessKey);

  const hash = hmac.finalize();
  const signature = hash.toString(CryptoJS.enc.Base64);

  cache.del(phoneNumber);

  let verifyCode = Math.floor(Math.random() * 1000000) + 1000000;
  if (verifyCode > 1000000) {
    verifyCode = verifyCode - 1000000;
  } else if (verifyCode < 100000) {
    veryfyCode = "0" + verifyCode;
  }

  cache.put(phoneNumber, verifyCode);

  axios
    .post(
      url,
      {
        type: "SMS",
        countryCode: `${countryCode}`,
        from: "01026273086",
        content: `Feather ???????????? ${verifyCode} ?????????.`,
        messages: [
          {
            to: `${phoneNumber}`,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "x-ncp-apigw-timestamp": date,
          "x-ncp-iam-access-key": accessKey,
          "x-ncp-apigw-signature-v2": signature,
        },
      }
    )
    .then((result) => {
      res.json({
        code: result.data.statusCode,
        status: result.data.statusName,
      });
    })
    .catch((e) => {
      cache.del(phoneNumber);
      console.log(e);
    });
});

router.post("/confirm", async (req, res) => {
  const { phoneNumber, verifyCode } = req.body;
  const CacheData = cache.get(phoneNumber);
  if (!CacheData || CacheData !== parseInt(verifyCode)) {
    res.send({
      status: "failure",
      code: 400,
    });
  } else {
    cache.del(phoneNumber);
    res.send({
      status: "success",
      code: 200,
    });
  }
});

router.post("/register", async (req, res) => {
  const { fname, lname, phoneNumber, username } = req.body;
  const newUser = new User({
    fname,
    lname,
    phoneNumber,
    username,
  });
  newUser
    .save()
    .then((result) => {
      console.log(result);
      res.json({
        status: "success",
        code: 200,
      });
    })
    .catch((e) => {
      console.log(e);
      res.json({
        status: "failure",
        code: 400,
      });
    });
});

router.post("/check", async (req, res) => {
  const { phoneNumber } = req.body;
  User.findOne({ phoneNumber }, (err, result) => {
    if (err) return res.status(500).send({ error: "database failure" });
    else {
      if (result?.username) {
        res.json({
          nickname: result?.username,
        });
      } else {
        res.json({
          nickname: "@Anonymous",
        });
      }
    }
  });
});

router.post("/check2", async (req, res) => {
  const { phoneNumber } = req.body;
  User.findOne({ phoneNumber }, (err, result) => {
    if (err) return res.status(500).send({ error: "database failure" });
    else {
      if (result) {
        res.json({
          fname: result?.fname,
          lname: result?.lname,
          username: result?.username,
        });
      } else {
        res.json({
          username: "@Anonymous",
        });
      }
    }
  });
});

app.use("/", router);

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true })
  .then(() => console.log("Successfully connected to mongodb"))
  .catch((e) => console.error(e));

const server = http.createServer(app).listen(process.env.PORT || 3000, () => {
  console.log("server listening on PORT 3000");
});
