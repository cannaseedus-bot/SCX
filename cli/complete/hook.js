import { completeVerb } from "./verbs.js";

const input = process.argv[2] || "";
const suggestions = completeVerb(input);

suggestions.forEach((verb) => console.log(verb));
