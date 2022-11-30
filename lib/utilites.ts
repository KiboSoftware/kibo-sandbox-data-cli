import jsonlines from 'jsonlines';
import path from 'path';
import fs from 'fs';
import fsPromise from 'fs/promises';

export function createJsonLFileStream(dataFilePath) {
  const source = fs.createReadStream(dataFilePath);
  const parser = jsonlines.parse({ emitInvalidLines: true });
  const dataStream = source.pipe(parser);
  return dataStream;
}

export function createJsonLFileWriteStream(dataFilePath) {
  createFilesDirIfNotExists(dataFilePath);
  var stringifier = jsonlines.stringify();
  const destStream = fs.createWriteStream(dataFilePath);
  stringifier.pipe(destStream);
  return stringifier;
}

export function createFilesDirIfNotExists(filename) {
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function isValidZip(path) {
  if (!path.endsWith('.zip')) {
    throw new Error('invalid file type, use zip');
  }
  try {
    await fsPromise.access(path);
  } catch (error) {
    console.error(error);
    throw new Error(`import file not found or inaccessible. path ${path}`);
  }
}
