const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const srcFile = path.join(__dirname, "..", "..", "src", "script.js");
const outFile = path.join(__dirname, "..", "..", "assets", "js", "app.js");

const source = fs.readFileSync(srcFile, "utf8");

const result = JavaScriptObfuscator.obfuscate(source, {
  compact: true,
  simplify: true,
  identifierNamesGenerator: "mangled-shuffled",
  renameGlobals: false,
  stringArray: true,
  stringArrayEncoding: ["base64", "rc4"],
  stringArrayThreshold: 1,
  rotateStringArray: true,
  shuffleStringArray: true,
  splitStrings: true,
  splitStringsChunkLength: 5,
  numbersToExpressions: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  selfDefending: false,
  disableConsoleOutput: false,
  target: "browser",
  seed: 0,
}).getObfuscatedCode();

fs.writeFileSync(outFile, result, "utf8");
console.log("Obfuscated: " + srcFile + " -> " + outFile + " (" + result.length + " bytes)");
