var { parse } = require("@jsonlines/core");
import fs from "fs";

export function helper(dataFilePath) {
  const source = fs.createReadStream(dataFilePath);
  const parseStream = parse();
  const dataStream = source.pipe(parseStream);
  return dataStream;
}
