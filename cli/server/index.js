import { start, stop } from "./lifecycle.js";
import { status } from "./status.js";

const cmd = process.argv[2];

if (cmd === "start") start();
if (cmd === "stop") stop();
if (cmd === "status") {
  const s = await status();
  console.log(s);
}
