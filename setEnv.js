const fs = require('fs');

let remote = process.argv[2]

const pre = "const remote = \"" + remote + "\"" + "\n"
const last = "module.exports = { remote }"

try {
    fs.writeFileSync('./scripts/components/env.js', pre + last);
    console.log("File has been saved.");
} catch (error) {
    console.error(error);
}