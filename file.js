import fs from 'fs';

export default class File {
  constructor(path) {
    this.path = path;
  }

  async get(prop) {
    try {
      const stdout = await fs.readFileSync(this.path, { encoding: 'utf-8' });
      const data = JSON.parse(stdout);
      return prop ? data[prop] : data;
    } catch (e) {
      console.error(
        `DNS-UPDATER: Can't read/parse the file '${this.path}', creating a new one...`
      );
      this.set({});
      return prop ? undefined : {};
    }
  }

  set(data) {
    return fs.writeFileSync(this.path, JSON.stringify(data, null, 2));
  }
};
