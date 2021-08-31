var { parse } = require("@jsonlines/core");
import fs from "fs";

export function createJsonLFileStream(dataFilePath) {
  const source = fs.createReadStream(dataFilePath);
  const parseStream = parse();
  const dataStream = source.pipe(parseStream);
  return dataStream;
}
