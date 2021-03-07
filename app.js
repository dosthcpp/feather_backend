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

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());
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
  }

  cache.put(phoneNumber, verifyCode);

  axios
    .post(
      url,
      {
        type: "SMS",
        countryCode: `${countryCode}`,
        from: "01026273086",
        content: `Feather 인증번호 ${verifyCode} 입니다.`,
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
      console.log(result.data);
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
app.use("/", router);

const server = http.createServer(app).listen(PORT, () => {
  console.log(`server listening on PORT ${PORT}`);
});
