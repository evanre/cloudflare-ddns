const axios = require('axios');
require('dotenv').config()
const { env } = process;
const File = require('./file');

// Currently we're caching last updated ip in ip.json file, on every check we compare actually IP and the cached one. If it's different, we update it.
// Alternative method of checking the nameserver ip is to resolve it, init resolver and set CloudFlare's nameservers:
// const { Resolver } = require('dns').promises;
// const resolver = new Resolver();
// resolver.setServers(['1.1.1.1', '1.0.0.1'])
// const address = await resolver.resolve4(r.zone).then(res => res[0]).catch(e => new Error(`Can't resolve: ${ r.zone }`));
// Then we can compare the address with the ip from the file.

const r = {
  url: 'https://api.cloudflare.com/client/v4/zones',
  cacheFile: `${__dirname}/ip.json`,
  token: env.CF_TOKEN,
  zone: env.CF_ZONE,
};

// Alias for short writing
const log = (txt) => console.log('DNS-UPDATER:', txt);

const request = async ({ endpoint = '', params = {}, data = {}, method = 'get'} = {}) => {
  const req = {
    method,
    data,
    params,
    url: `${r.url}${endpoint}`,
    headers: {
      Authorization: `Bearer ${r.token}`,
      'Content-Type': 'application/json',
    },
  };

  return await axios(req)
    .then(({ data: { result } }) => result)
    .catch((e) => {
      log(new Error(e));
      process.exit(1);
    });
};

const getRecords = async (file, cached) => {
  let needToUpdateFile = false;

  cached.zoneId =
    cached.zoneId ||
    (await request({ params: { name: r.zone, status: 'active' } }).then(
      ([{ id }]) => {
        log(`Didn't find zoneId in file, requested one is: ${id}`);
        needToUpdateFile = true;
        return id;
      }
    ));

  cached.recordIds =
    cached.recordIds ||
    (await request({ endpoint: `/${cached.zoneId}/dns_records`, params: { type: 'A' } })
      .then((arr) =>
        arr.map(({ id, name, type }) => ({ id, name, type }))
      )
      .then((arr) => {
        log(`Didn't find recordIds in file, requested ones are:`);
        log(arr);
        needToUpdateFile = true;
        return arr;
      }));

  if (needToUpdateFile) {
    file.set(cached);
  } else {
    log(`All data are cached, no requests.`);
  }
};

const go = async () => {
  const file = new File(r.cacheFile);
  const cached = await file.get();

  const ip = await axios
    .get('https://checkip.amazonaws.com')
    .then(({ data }) => {
      log(`Time: ${ new Date() }, Current IP: ${data.trim()}`);
      return data.trim();
    })
    .catch((e) => {
      console.error(new Error(`Can't resolve current IP address`));
      console.error(e);
      process.exit(1);
    });

  if (cached.ip === ip) {
    log(`IPs are equal. No need to update`);
    process.exit(0);
  }

  await getRecords(file, cached);

  await Promise.all(
    cached.recordIds.map(
      async ({ id, name, type }) =>
        await request({
          method: 'put',
          data: { type, name, content: ip, ttl: 1, proxied: false },
          endpoint: `/${cached.zoneId}/dns_records/${id}`,
        })
    )
  )
    .then((arr) => {
      const list = arr.map(({ name }) => name).join('", "');
      log(`Zone names ["${list}"] were updated to IP ${ip}`);
      file.set({ ...cached, ip });
    })
    .catch((e) => new Error(e));
};

go();