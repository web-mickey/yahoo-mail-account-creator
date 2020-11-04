const puppeteer = require("puppeteer-extra");
const fetch = require("node-fetch");
const random_ua = require("modern-random-ua");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const cookies = require("./cookies");
const useProxy = require("puppeteer-page-proxy");
const BASE_URL = "https://login.yahoo.com/account/create";
const apiKey = require("./apiKey");
var fs = require("fs");
const randomNumber = Math.random() * (3000 - 1000) + 1000;
const randomTypingNumber = () => {
  let number = Math.random() * (500 - 50) + 50;

  // console.log(number);
  return number;
};

let phoneNumber;
let numberId;
let smsCodeWaitingTime = 0;
let emailCreated;
let passwordCreated = "zaq1@WSXCDE#4rfv!";
let accountsCreated = [];
// let reusePhoneNumber = false;

cancelActivation = async (id) => {
  await fetch(
    `https://sms-activate.ru/stubs/handler_api.php?api_key=${apiKey}&action=setStatus&status=8&id=${id}`
  ).then(async (r) => {
    console.log("Number deactivated");
  });
};

const nitrotype = {
  browser: null,
  page: null,

  initialize: async (proxy, proxyLogin, proxyPassword) => {
    nitrotype.browser = await puppeteer.launch({
      headless: false,
      userDataDir: "/tmp/myChromeSession",
      ignoreDefaultArgs: ["--disable-extensions"],
      args: [
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        `--proxy-server=${proxy}`,
        // "--proxy-server=185.164.56.20:80",
        // "--ignore-certificate-errors",
        // "--ignore-certificate-errors-spki-list ",
      ],
    });

    nitrotype.page = await nitrotype.browser.newPage();

    await nitrotype.page.setUserAgent(random_ua.generate());

    await nitrotype.page.setCookie.apply(nitrotype.page, cookies);

    if ((proxyLogin, proxyPassword)) {
      await nitrotype.page.authenticate({
        username: proxyLogin,
        password: proxyPassword,
      });
    }

    console.log();
    console.log("Your actual IP is: ", proxy);

    const noPage = setTimeout(async () => {
      clearTimeout(noPage);

      console.log("Page not loaded, proxy is not working");

      await nitrotype.browser.close();
    }, 10000);

    await nitrotype.page.goto(BASE_URL, { waitUntil: "networkidle2" });

    const formNameInput = await nitrotype.page.$("#usernamereg-firstName");

    if (formNameInput) {
      clearTimeout(noPage);
    }
  },

  // changeProxy: async (proxy) => {
  //   console.log(proxy);
  //   await nitrotype.page.setRequestInterception(true);
  //   nitrotype.page.on("request", (req) => {
  //     useProxy(req, `http://${proxy}`);
  //   });
  //   // const data = await useProxy.lookup(nitrotype.page);
  //   // console.log(data.ip);

  //   // console.log("Changing proxy");
  //   // await nitrotype.page.setExtraHTTPHeaders({
  //   //   "x-no-forward-upstream-proxy": `http://${proxy}`,
  //   // });
  //   // console.log(proxy);
  //   // await useProxy(nitrotype.page, `http://${proxy}`);
  //   // const data = await useProxy.lookup(nitrotype.page);
  //   // console.log(data.ip);
  // },

  activateNumber: async (id, name, shortcut) => {
    await nitrotype.page.waitForTimeout(5000);

    await fetch(
      `https://sms-activate.ru/stubs/handler_api.php?api_key=${apiKey}&action=getBalance`
    ).then(async (r) => {
      const response = await r.text();
      if (response.slice(0.15) === 0) {
        console.log("No balance on account");
        await nitrotype.browser.close();
      }
    });

    console.log(`Actual country is ${name} with shortcut ${shortcut}`);

    const orderNumber = async () => {
      await fetch(
        `https://sms-activate.ru/stubs/handler_api.php?api_key=${apiKey}&action=getNumber&service=mb&country=${id}`
      )
        .then(async (r) => {
          const response = await r.text();
          const splittedResponse = response.split(":");

          numberId = splittedResponse[1];
          phoneNumber = splittedResponse[2];

          if (response.includes("ACCESS_NUMBER")) {
            console.log();
            console.log(
              `Ordered an id: ${numberId} with number: ${phoneNumber}`
            );
          } else if (response === "NO_BALANCE") {
            const noBalanceTimeout = setTimeout(async () => {
              clearTimeout(noBalanceTimeout);
              await nitrotype.browser.close();
            }, 10000);

            // reusePhoneNumber = true;
            console.log("No balance on account");
            await nitrotype.browser.close();
          } else if (response === "NO_NUMBERS") {
            console.log("No numbers");
            await nitrotype.browser.close();
          } else {
            console.log("Error", response);
            await orderNumber();
          }
        })
        .catch(async (e) => {
          console.error(e);
          await orderNumber();
        });
    };
    await orderNumber();

    // if (!reusePhoneNumber) {
    //   await orderNumber();
    // } else {
    //   console.log();
    //   console.log("Using last number because unused: ", phoneNumber);
    // }
  },

  register: async (id, shortcut, numberCuts, randomAccountsFileName) => {
    const randomWord = Math.random().toString(36).substring(2);

    console.log("Filling the form");
    await nitrotype.page.waitForTimeout(2000);

    await nitrotype.page.type("input[name=firstName]", randomWord, {
      delay: 50,
    });
    await nitrotype.page.type("input[name=lastName]", randomWord.substring(2), {
      delay: 50,
    });

    await nitrotype.page.click("#usernamereg-yid");

    await nitrotype.page.waitForTimeout(4000);

    const firstItemFromSuggestions = await nitrotype.page.$(
      "#desktop-suggestion-list > li"
    );

    if (firstItemFromSuggestions) {
      await firstItemFromSuggestions.click();
    }

    emailCreated = `${await nitrotype.page.$eval(
      "#usernamereg-yid",
      (e) => e.value
    )}@yahoo.com`;

    await nitrotype.page.type("input[name=password]", passwordCreated, {
      delay: 50,
    });

    await nitrotype.page.select(".puree-dropdown select", shortcut);

    await nitrotype.page.type(
      "input[name=phone]",
      phoneNumber.substring(numberCuts),
      {
        delay: 50,
      }
    );

    await nitrotype.page.select("#usernamereg-month", "1");

    await nitrotype.page.type("input[name=dd]", "12", {
      delay: 50,
    });

    await nitrotype.page.type("input[name=yyyy]", "1990", {
      delay: 50,
    });

    await nitrotype.page.waitForTimeout(2000);

    await nitrotype.page.click("button[type=submit]");

    await nitrotype.page.waitForTimeout(2000);

    // const badTypedEmail = await nitrotype.page.$(".oneid-error-message");
    const badTypedEmail = await nitrotype.page.$("#usernamereg-firstName");

    if (badTypedEmail) {
      console.log("There was problem with the form");

      console.log("Failed to create new account");
      // reusePhoneNumber = true;
      await cancelActivation(numberId);
      await nitrotype.browser.close();
    }

    await nitrotype.page.waitForTimeout(5000);

    const failChallenge = await nitrotype.page.$(".fail-challenge ");

    if (failChallenge) {
      console.log("Too many attemps");
      // reusePhoneNumber = true;
      await cancelActivation(numberId);
      console.log("Failed to create new account");
      await nitrotype.browser.close();
    }

    const sendCodeButton = await nitrotype.page.$("button[type=submit]");

    if (!sendCodeButton) {
      // reusePhoneNumber = true;
      console.log("Got captcha...");
      await cancelActivation(numberId);
      await nitrotype.browser.close();

      await nitrotype.page.waitForTimeout("iframe");

      const elementHandle = await nitrotype.page.$("#recaptcha-iframe");
      const frame = await elementHandle.contentFrame();

      const dataSiteKey = await frame.evaluate(
        'document.querySelector("#g-recaptcha").getAttribute("data-sitekey")'
      );

      await fetch(
        `https://2captcha.com/in.php?key=e7d15be911cac837ea9234405dc4e1a5&method=userrecaptcha&googlekey=${dataSiteKey}&pageurl=${nitrotype.page.url()}&json=true`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 1) {
            console.log("Got response");
            captchaIdResponse = data.request;
          } else {
            console.log("Error: ", data.error_text);
          }
        });

      const fetchFinalValue = async () => {
        await fetch(
          `https://2captcha.com/res.php?key=e7d15be911cac837ea9234405dc4e1a5&action=get&id=${captchaIdResponse}&json=true`
        )
          .then((res) => res.json())
          .then(async (data) => {
            if (data.request === "CAPCHA_NOT_READY") {
              await nitrotype.page.waitForTimeout(10000);

              console.log("Captcha not ready");
              await fetchFinalValue();
            } else {
              console.log("Got input value");

              console.log(data.request);

              await frame.$eval("#recaptcha-submit", (e) =>
                e.removeAttribute("disabled")
              );

              await frame.click("#recaptcha-submit");
            }
          });
      };

      await fetchFinalValue();

      // await nitrotype.browser.close();
    } else {
      await fetch(
        `https://sms-activate.ru/stubs/handler_api.php?api_key=${apiKey}&action=setStatus&status=1&id=${numberId}`
      ).then(async (r) => {
        if ((await r.text()) === "ACCESS_READY") {
          console.log("Waiting for sms code");
        }
      });
      await nitrotype.page.waitForTimeout(4000);

      await nitrotype.page.click("button[type=submit]");
    }

    await nitrotype.page.waitForTimeout(10000);

    const getSmsCode = async () => {
      await fetch(
        `https://sms-activate.ru/stubs/handler_api.php?api_key=${apiKey}&action=getStatus&id=${numberId}`
      )
        .then(async (r) => {
          const response = await r.text();

          if (response === "STATUS_WAIT_CODE") {
            if (smsCodeWaitingTime === 500) {
              smsCodeWaitingTime = 0;
              // reusePhoneNumber = true;

              // console.log("Waiting too much time for sms code");
              await cancelActivation(numberId);
              await nitrotype.browser.close();
              throw new Error("Waiting too much time for sms code");
            }
            smsCodeWaitingTime++;

            await getSmsCode();
          } else {
            console.log("Got the code! ", response.substring(10));
            await nitrotype.page.type(
              "input[name=code]",
              response.substring(10),
              {
                delay: 50,
              }
            );

            const verifyCode = await nitrotype.page.$("#verify-code-button");
            if (verifyCode) {
              await nitrotype.page.click("#verify-code-button");
              await nitrotype.page.waitForTimeout(10000);

              console.log("Account created succesfully!");

              console.log(
                `Saving to file: ${emailCreated} , ${passwordCreated}`
              );

              accountsCreated.push(`${emailCreated} : ${passwordCreated}`);

              fs.writeFile(
                `accounts-${randomAccountsFileName}.txt`,
                JSON.stringify(accountsCreated),
                (err) => {
                  if (err) console.log(err);
                  console.log("Successfull updated accounts text file");
                  console.log("Accounts created:", accountsCreated.length);
                }
              );
            } else {
              console.log("Unknown problem with creating account...");
            }
          }
        })
        .catch((e) => console.error("Error:" + e));
    };
    await getSmsCode();

    await nitrotype.browser.close();

    // ---------------------------------------- CAPTCHA STUFF ----------------------------------------
  },
};

module.exports = nitrotype;
