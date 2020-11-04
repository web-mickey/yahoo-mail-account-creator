const bot = require("./patrol");
var fs = require("fs");
const countries = require("./countries");
const startedWorkingTime = new Date();
const randomAccountsFileName = Math.random().toString(36).substring(2);

let mappedProxies = [];
let proxyAddress;
let proxyLogin;
let proxyPassword;

function msToTime(duration) {
  let seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;

  return hours + ":" + minutes + ":" + seconds;
}

(async () => {
  console.log("");
  console.log(
    "Started working time: ",
    startedWorkingTime.getDate() +
      "/" +
      (startedWorkingTime.getMonth() + 1) +
      "/" +
      startedWorkingTime.getFullYear() +
      " - " +
      startedWorkingTime.getHours() +
      ":" +
      startedWorkingTime.getMinutes()
  );
  console.log();
  try {
    // read contents of the file
    // const data = fs.readFileSync("workingProxies.txt", "UTF-8");
    const data = fs.readFileSync("proxies.txt", "UTF-8");

    // split the contents by new line
    const lines = data.split(/\r?\n/);

    lines.map((line) => {
      if (line) {
        const splittedLine = line.split(":");
        if (splittedLine.length > 1) {
          proxyAddress = `${splittedLine[0]}:${splittedLine[1]}`;
          proxyLogin = splittedLine[2];
          proxyPassword = splittedLine[3];

          mappedProxies.push(proxyAddress);
        } else {
          mappedProxies.push(line);
        }
      }
    });
  } catch (err) {
    console.error(err);
  }

  console.log();
  console.log("Proxy list is:", mappedProxies);

  for (let i = 0; i < mappedProxies.length; i++) {
    // await bot.changeProxy(proxies[i]);

    for (let j = 0; j < countries.length; j++) {
      const actualTime = new Date();
      if (actualTime < startedWorkingTime) {
        actualTime.setDate(actualTime.getDate() + 1);
      }

      const diff = actualTime - startedWorkingTime;
      console.log("Working time is:", msToTime(diff));

      try {
        await bot.initialize(mappedProxies[i], proxyLogin, proxyPassword);

        await bot.activateNumber(
          countries[j].id,
          countries[j].name,
          countries[j].shortcut
        );
      } catch (e) {
        console.log(e.message);
      }
      try {
        await bot.register(
          countries[j].id,
          countries[j].shortcut,
          countries[j].numberCuts,
          randomAccountsFileName
        );
      } catch (e) {
        console.log(e.message);
      }
    }
  }

  console.log("Bot ended work!");
})();
