importScripts("static/js/ipdbs.js");
var buildPac = /* @__PURE__ */ (function() {
  var DIRECT_HOSTS = [
    "223.6.6.6",
    "223.5.5.5",
    "136data.com",
    "keyhuawei.com",
    "statichuawei.com",
    "cdnfeishu.com",
    "y62i.com",
    "webstoreconsole.com",
    "monsnssdk.com",
    "47.106.228.226",
    "110.41.156.114",
    "95516.com",
    "chinapay.com",
    "unionpaysecure.com",
    "cup.com.cn",
    "alipay.com",
    "alipayplus.com",
    "marmot-cloud.com",
    "alipayobjects.com",
    "jego.cloud",
    "localhost"
  ];
  var IPV4_RE = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
  function isPrivateIp(ip) {
    return /^(::f{4}:)?10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(ip) || /^(::f{4}:)?192\.168\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(ip) || /^(::f{4}:)?172\.(1[6-9]|2\d|16|23|30|31)\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(ip) || /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(ip) || /^(::f{4}:)?169\.254\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(ip) || /^f[cd][0-9a-f]{2}:/i.test(ip) || /^fe80:/i.test(ip) || /^::1$/.test(ip) || /^::$/.test(ip);
  }
  function isGeoIp(strip) {
    var ip = convert_addr(strip);
    var left = 0, right = geo_ips.length;
    if (right == 0) {
      return false;
    }
    do {
      var mid = Math.floor((left + right) / 2), ipf = (ip & geo_ips[mid][1]) >>> 0, m = (geo_ips[mid][0] & geo_ips[mid][1]) >>> 0;
      if (ipf == m) {
        return true;
      } else if (ipf > m) {
        left = mid + 1;
      } else {
        right = mid;
      }
    } while (left + 1 <= right);
    return false;
  }
  function isMatchHost(host, val) {
    return dnsDomainIs(host, val) || shExpMatch(host, val);
  }
  function isDirect(host) {
    for (var i in direct_hosts) {
      var val = direct_hosts[i];
      if (isPlainHostName(host) || isPrivateIp(host) || isMatchHost(host, val)) {
        return true;
      }
    }
    return false;
  }
  function FindProxyForURL(url, host) {
    if (isDirect(host)) {
      return direct;
    }
    if (proxy_test_urls.hasOwnProperty(host)) {
      return proxy_test_urls[host];
    }
    if (MODE.rule) {
      for (var val in proxy_rule_user) {
        if (isMatchHost(host, val)) {
          return proxy_rule_user[val];
        }
      }
      for (var val in proxy_rule) {
        if (isMatchHost(host, val)) {
          return proxy_rule[val];
        }
      }
    }
    if (MODE.geoip) {
      var strIp = ipv4.test(host) ? host : dnsResolve(host);
      if (!strIp) {
        return proxy;
      }
      if (isGeoIp(strIp)) {
        return direct;
      }
    }
    return MODE.global ? proxy : direct;
  }
  return function buildPac2(config, geoip2) {
    config = config || {};
    var mode = config.mode || {};
    var geoIpsLiteral = mode.geoip && geoip2 ? geoip2 : "[]";
    var lines = [
      'var direct = "DIRECT";',
      "var proxy = " + JSON.stringify(config.proxy || "DIRECT") + ";",
      "var proxy_rule = " + JSON.stringify(config.proxy_rule || {}) + ";",
      "var proxy_rule_user = " + JSON.stringify(config.proxy_rule_user || {}) + ";",
      "var proxy_test_urls = " + JSON.stringify(config.proxy_test_urls || {}) + ";",
      "var geo_ips = " + geoIpsLiteral + ";",
      "var direct_hosts = " + JSON.stringify(DIRECT_HOSTS) + ";",
      "var MODE = { rule: " + !!mode.rule + ", geoip: " + !!mode.geoip + ", global: " + !!mode["global"] + " };",
      "var ipv4 = " + IPV4_RE.toString() + ";",
      isPrivateIp.toString(),
      isGeoIp.toString(),
      isMatchHost.toString(),
      isDirect.toString(),
      FindProxyForURL.toString()
    ];
    return lines.join("\n");
  };
})();
const manifest = chrome.runtime.getManifest();
const doh_servers = ["https://223.5.5.5/resolve", "https://223.6.6.6/resolve"];
const pass_apps = ["IDM Integration Module"];
var default_api_urls = [
  "https://*.keyhuawei.com",
  "https://110.41.156.114:2090",
  "http://*.monsnssdk.com",
  "https://*.webstoreconsole.com"
];
const api_doh_domain = "v3.jego.club";
var speed_tester = {};
var diagnostics_geo_ips = null;
const diagnostics_direct_hosts = [
  "223.6.6.6",
  "223.5.5.5",
  "136data.com",
  "keyhuawei.com",
  "statichuawei.com",
  "cdnfeishu.com",
  "y62i.com",
  "webstoreconsole.com",
  "monsnssdk.com",
  "47.106.228.226",
  "110.41.156.114",
  "95516.com",
  "chinapay.com",
  "unionpaysecure.com",
  "cup.com.cn",
  "alipay.com",
  "alipayplus.com",
  "marmot-cloud.com",
  "alipayobjects.com",
  "jego.cloud",
  "localhost"
];
const diagnostics_ipv4 = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
function setIconByMode(mode) {
  let iconPaths;
  switch (mode) {
    case "0":
      iconPaths = {
        16: "static/img/icon-off-16.png",
        48: "static/img/icon-off-48.png",
        128: "static/img/icon-off-128.png"
      };
      break;
    case "5":
      iconPaths = {
        16: "static/img/icon16.png",
        48: "static/img/icon48.png",
        128: "static/img/icon128.png"
      };
      break;
    case "7":
      iconPaths = {
        16: "static/img/icon-rule-16.png",
        48: "static/img/icon-rule-48.png",
        128: "static/img/icon-rule-128.png"
      };
      break;
    default:
      iconPaths = {
        16: "static/img/icon16.png",
        48: "static/img/icon48.png",
        128: "static/img/icon128.png"
      };
      break;
  }
  chrome.action.setIcon({ path: iconPaths });
}
function fetchWithTimeout(url, options, timeout = 5e3) {
  if (!options.hasOwnProperty("headers")) {
    options["headers"] = {};
  }
  options["headers"]["Pac-Format"] = "json";
  return Promise.race([
    fetch(url, options),
    new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Request timeout")), timeout)
    )
  ]).catch((error) => {
    console.log(`Error during fetch: ${error.message} ${url}`);
    return { error: true, message: error.message };
  });
}
function get_time() {
  var date = /* @__PURE__ */ new Date();
  return date.getTime();
}
function get_uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
function make_tmp_url(host) {
  var uuid = get_uuid();
  host = host.replace("*", uuid);
  if (!host.startsWith("http://") && !host.startsWith("https://")) {
    host = "https://" + host;
  }
  return host;
}
function build_api_urls(urls) {
  var new_api_urls = [];
  for (var v in urls) {
    new_api_urls.push(make_tmp_url(urls[v]));
  }
  return new_api_urls;
}
function build_api_query(query = {}) {
  query["version"] = manifest.version;
  return query;
}
function urlencode(query) {
  var q = [];
  for (var v in query) {
    q.push(v + "=" + escape(query[v]));
  }
  return q.join("&");
}
function build_request_api_url(host, path = "", query = {}) {
  var url = host + path;
  for (var _ in query) {
    url = url + "?" + urlencode(query);
    break;
  }
  return url;
}
function async_api_from_doh(domain) {
  for (var val in doh_servers) {
    var url = doh_servers[val] + "?type=16&name=" + domain;
    setTimeout(function() {
      fetch(url, { mode: "cors", timeout: 5e3 }).then(function(req) {
        if (!req.ok) {
          return;
        }
        req.json().then(function(r) {
          var doh_apis = [];
          for (var i in r.Answer) {
            var rurl = r.Answer[i].data;
            rurl = rurl.replace('"', "").replace('"', "");
            doh_apis.push(rurl);
          }
          var urls = doh_apis;
          for (var vl in default_api_urls) {
            urls.push(default_api_urls[vl]);
          }
          chrome.storage.local.set({ urls: build_api_urls(urls) });
        });
      }).catch(console.log);
    }, 1e3);
  }
}
function set_proxy_system() {
  var pconf = { "scope": "regular", "value": { "mode": "system" } };
  chrome.proxy.settings.set(pconf, function() {
  });
}
function remove_other_apps() {
  var myid = chrome.runtime.id;
  chrome.management.getAll(function(apps) {
    for (var i in apps) {
      var app = apps[i];
      if (pass_apps.includes(app.name)) {
        continue;
      }
      if (myid == app.id || !app.enabled) {
        continue;
      }
      for (var i2 in app.permissions) {
        if (app.permissions[i2] == "proxy") {
          chrome.management.setEnabled(app.id, false);
        }
      }
    }
  });
}
function make_pac_script(conf) {
  var pac = conf.value.pacScript.data;
  pac = pac.replace("<geoip>", geoip);
  conf["value"]["pacScript"]["data"] = pac;
  return conf;
}
function set_chrome_proxy_settings(conf) {
  chrome.storage.local.set({ proxy: conf });
  if (conf.value.hasOwnProperty("pacScript") && conf.value.pacScript.hasOwnProperty("data")) {
    conf = make_pac_script(conf);
  }
  if (conf.hasOwnProperty("scope")) {
    chrome.proxy.settings.set(conf, function() {
      console.log("proxy set success");
    });
  } else if (conf.value.hasOwnProperty("proxyType")) {
    browser.proxy.settings.set(conf);
  }
}
function speed_test(val) {
  var s = get_time();
  fetchWithTimeout(val.url, {}, 3e3).then(function(req) {
    val["ptime"] = get_time() - s;
    speed_tester[val.id] = val;
    chrome.storage.local.set({ speed_tester });
  });
}
function run_speed_tester(tlist) {
  chrome.storage.local.get("speed_tester", function(ldata) {
    speed_tester = {};
    if (ldata.hasOwnProperty("speed_tester")) {
      speed_tester = ldata.speed_tester;
    }
    for (var val in tlist) {
      speed_test(tlist[val]);
    }
  });
}
async function set_chrome_settings(data) {
  if (typeof data !== "object" || !data.hasOwnProperty("session")) {
    return;
  }
  let sessionData = data.session;
  const diagOnly = !!sessionData.diagnostics_only;
  if (sessionData.hasOwnProperty("token")) {
    await storage_set({ token: sessionData.token });
  }
  if (sessionData.local_api_domains) {
    save_local_api_domains(sessionData.local_api_domains);
  }
  if (sessionData.proxy_config) {
    await storage_set({
      diagnostics_proxy_config: sessionData.proxy_config,
      diagnostics_proxy_mode: String(sessionData.proxy_mode || "0")
    });
    let pacConfig = sessionData.proxy_config;
    if (diagOnly && sessionData.node_probe_routes) {
      pacConfig = Object.assign({}, sessionData.proxy_config, {
        proxy_test_urls: Object.assign(
          {},
          sessionData.proxy_config.proxy_test_urls || {},
          sessionData.node_probe_routes
        )
      });
    }
    const conf = {
      scope: "regular",
      value: { mode: "pac_script", pacScript: { data: buildPac(pacConfig, geoip) } }
    };
    if (diagOnly) {
      await apply_pac_no_persist(conf);
    } else if (!await node_check_holding()) {
      set_chrome_proxy_settings(conf);
    } else {
      await storage_set({ proxy: conf });
    }
  } else if (sessionData.proxy_settings) {
    await storage_set({
      diagnostics_proxy_config: null,
      diagnostics_proxy_mode: String(sessionData.proxy_mode || "0")
    });
    if (!await node_check_holding()) {
      set_chrome_proxy_settings(sessionData.proxy_settings);
    } else {
      await storage_set({ proxy: sessionData.proxy_settings });
    }
    if (sessionData.proxy_settings_hash) {
      await storage_set({ pskey: sessionData.proxy_settings_hash });
    }
  }
  if (sessionData.speed_tester && !diagOnly) {
    await storage_set({ diagnostics_speed_tester: sessionData.speed_tester });
    run_speed_tester(sessionData.speed_tester);
  }
  if (sessionData.hasOwnProperty("proxy_mode")) {
    await storage_set({ diagnostics_proxy_mode: String(sessionData.proxy_mode) });
    setIconByMode(sessionData.proxy_mode);
  }
}
async function apply_pac_no_persist(conf) {
  if (conf.value.hasOwnProperty("pacScript") && conf.value.pacScript.hasOwnProperty("data")) {
    conf = make_pac_script(conf);
  }
  if (conf.hasOwnProperty("scope")) {
    await new Promise((resolve) => chrome.proxy.settings.set(conf, resolve));
  } else if (conf.value.hasOwnProperty("proxyType")) {
    browser.proxy.settings.set(conf);
  }
}
async function node_check_holding() {
  const s = await storage_get(["node_check_hold"]);
  return !!(s.node_check_hold && s.node_check_hold > Date.now());
}
async function restore_normal_pac() {
  const store = await storage_get(["proxy"]);
  if (store.proxy) await apply_pac_no_persist(store.proxy);
}
function async_session(cb) {
  var keys = ["urls", "token", "speed_tester", "pskey"];
  chrome.storage.local.get(keys, function(req) {
    if (!req.hasOwnProperty("urls") || req.urls.length == 0) {
      req.urls = build_api_urls(default_api_urls);
      chrome.storage.local.set({ urls: req.urls });
    }
    if (!req.hasOwnProperty("speed_tester")) {
      req.speed_tester = {};
      chrome.storage.local.set({ speed_tester: {} });
    }
    var q = build_api_query();
    if (req.hasOwnProperty("speed_tester")) {
      q["speed_tester"] = JSON.stringify(req.speed_tester);
    }
    var data = { method: "POST", headers: {} };
    if (req.hasOwnProperty("token")) {
      data["headers"] = { "token": req.token };
      q["token"] = req.token;
    }
    data["headers"]["content-type"] = "application/json";
    if (req.hasOwnProperty("pskey")) {
      data["headers"]["pskey"] = req.pskey;
    }
    data["timeout"] = 5e3;
    data["mode"] = "cors";
    var url = build_request_api_url(req.urls.shift(), "/chrome/session", q);
    fetchWithTimeout(url, data).then(function(req2) {
      req2.json().then(cb).catch(console.log);
    }).catch(function(err) {
      if (req.urls.length == 0) {
        req.urls = build_api_urls(default_api_urls);
        async_api_from_doh(api_doh_domain);
      }
      chrome.storage.local.set({ urls: req.urls }).then(() => {
        setTimeout(function() {
          async_session(cb);
        }, 1e4);
      });
    });
  });
}
function chrome_session() {
  async_session(set_chrome_settings);
}
function cron_chrome_session() {
  var delayInMinutes = 180;
  chrome.alarms.clear();
  chrome.alarms.create({ delayInMinutes });
  chrome_session();
}
function save_local_api_domains(data) {
  if (typeof data == "object" && data.length > 0) {
    chrome.storage.local.set({ api_domains: data });
  }
}
function async_local_api_domains() {
  chrome.storage.local.get("api_domains", function(local) {
    if (local.hasOwnProperty("api_domains") && local.api_domains.length > 0) {
      Array.prototype.unshift.apply(default_api_urls, local.api_domains);
    }
  });
}
function storage_get(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}
function storage_set(obj) {
  return new Promise((resolve) => chrome.storage.local.set(obj, resolve));
}
async function ensure_urls(store) {
  if (!store.urls || store.urls.length === 0) {
    store.urls = build_api_urls(default_api_urls);
    await storage_set({ urls: store.urls });
    async_api_from_doh(api_doh_domain);
  }
  return store.urls;
}
async function build_url_for(path, query) {
  const store = await storage_get(["urls", "token", "pskey"]);
  const urls = await ensure_urls(store);
  const q = build_api_query(query || {});
  if (store.token) q["token"] = store.token;
  const url = build_request_api_url(urls[0], path, q);
  return { url, token: store.token || null, pskey: store.pskey || null };
}
async function rotate_url() {
  const store = await storage_get(["urls"]);
  let urls = store.urls || [];
  if (urls.length > 0) urls.shift();
  if (urls.length === 0) {
    urls = build_api_urls(default_api_urls);
    async_api_from_doh(api_doh_domain);
  }
  await storage_set({ urls });
  return { ok: true, remaining: urls.length };
}
function fetch_external_with_timeout(url, options, timeout = 7e3) {
  return Promise.race([
    fetch(url, options),
    new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Request timeout")), timeout)
    )
  ]);
}
function parse_trace(text) {
  const out = {};
  String(text || "").split("\n").forEach((line) => {
    const idx = line.indexOf("=");
    if (idx > 0) out[line.slice(0, idx)] = line.slice(idx + 1).trim();
  });
  return out;
}
function is_overseas_country(code) {
  return String(code || "").toUpperCase() !== "CN";
}
function probe_urls(probe) {
  if (Array.isArray(probe.urls) && probe.urls.length > 0) return probe.urls;
  return [probe.url];
}
function error_message(err) {
  return err && err.message ? err.message : "Request failed";
}
async function fetch_json(url, options) {
  const req = await fetch_external_with_timeout(url, options, 7e3);
  if (!req.ok) throw new Error("HTTP " + req.status);
  return await req.json();
}
async function fetch_trace_probe(probe) {
  const started = get_time();
  const errors = [];
  for (const url of probe_urls(probe)) {
    try {
      const req = await fetch_external_with_timeout(url, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        redirect: "follow"
      }, 7e3);
      if (!req.ok) throw new Error("HTTP " + req.status);
      const data = parse_trace(await req.text());
      if (!data.ip) throw new Error("No IP returned");
      return {
        id: probe.id,
        source: probe.source,
        type: "geo",
        ok: true,
        ip: data.ip,
        country_code: data.loc || "",
        location: [data.loc, data.colo ? "Cloudflare " + data.colo : ""].filter(Boolean).join(" \xB7 "),
        endpoint: url,
        raw: JSON.stringify(data),
        overseas: is_overseas_country(data.loc),
        elapsed_ms: get_time() - started
      };
    } catch (err) {
      errors.push(error_message(err));
    }
  }
  return {
    id: probe.id,
    source: probe.source,
    type: "geo",
    ok: false,
    message: errors.join("; ") || "Request failed",
    elapsed_ms: get_time() - started
  };
}
function normalize_geo_payload(data) {
  const ip = data && (data.ip || data.query);
  let countryCode = data && (data.cc || data.country_code || "");
  let countryName = data && (data.country_name || data.country || "");
  if (!countryCode && typeof countryName === "string" && countryName.length === 2) {
    countryCode = countryName;
    countryName = "";
  }
  if (!countryName && data && data.city) countryName = data.city;
  return {
    ip,
    country_code: countryCode || "",
    location: [countryName, countryCode].filter(Boolean).join(" \xB7 ")
  };
}
async function fetch_myip_probe(probe) {
  const started = get_time();
  const errors = [];
  for (const url of probe_urls(probe)) {
    try {
      const data = await fetch_json(url, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        redirect: "follow"
      });
      const normalized = normalize_geo_payload(data);
      if (!normalized.ip) throw new Error("No IP returned");
      return {
        id: probe.id,
        source: probe.source,
        type: "geo",
        ok: true,
        ip: normalized.ip,
        country_code: normalized.country_code,
        location: normalized.location,
        endpoint: url,
        raw: JSON.stringify(data),
        overseas: is_overseas_country(normalized.country_code),
        elapsed_ms: get_time() - started
      };
    } catch (err) {
      errors.push(error_message(err));
    }
  }
  return {
    id: probe.id,
    source: probe.source,
    type: "geo",
    ok: false,
    message: errors.join("; ") || "Request failed",
    elapsed_ms: get_time() - started
  };
}
function probe_status_ok(url, status) {
  if (/generate_204/.test(url)) return status === 204;
  if (/api\.openai\.com/.test(url)) return status === 200 || status === 401;
  return status >= 200 && status < 400;
}
async function fetch_reachability_probe(probe) {
  const started = get_time();
  const errors = [];
  for (const url of probe_urls(probe)) {
    try {
      const req = await fetch_external_with_timeout(url, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        redirect: "follow"
      }, 7e3);
      const reachable = probe_status_ok(url, req.status);
      if (!reachable) throw new Error("HTTP " + req.status);
      return {
        id: probe.id,
        source: probe.source,
        type: "reachability",
        ok: true,
        reachable: true,
        message: "Reachable",
        endpoint: url,
        elapsed_ms: get_time() - started
      };
    } catch (err) {
      errors.push(error_message(err));
    }
  }
  return {
    id: probe.id,
    source: probe.source,
    type: "reachability",
    ok: false,
    reachable: false,
    message: errors.join("; ") || "Request failed",
    elapsed_ms: get_time() - started
  };
}
async function check_exit_ip() {
  const probes = [
    {
      id: "cloudflare",
      source: "Cloudflare trace",
      urls: [
        "https://www.cloudflare.com/cdn-cgi/trace",
        "https://one.one.one.one/cdn-cgi/trace",
        "https://cloudflare.tv/cdn-cgi/trace"
      ],
      handler: fetch_trace_probe
    },
    {
      id: "myip",
      source: "GeoIP service",
      urls: [
        "https://api.myip.com",
        "https://ipinfo.io/json",
        "https://ipwho.is/"
      ],
      handler: fetch_myip_probe
    },
    {
      id: "google",
      source: "Google reachability",
      urls: [
        "https://www.google.com/generate_204"
      ],
      handler: fetch_reachability_probe
    }
  ];
  const results = await Promise.all(probes.map((probe) => probe.handler(probe)));
  const successful = results.filter((item) => item.ok && item.type === "geo");
  let status = "unknown";
  if (successful.length > 0 && successful.every((item) => item.overseas)) {
    status = "overseas";
  } else if (successful.some((item) => item.overseas === false)) {
    status = "mainland";
  } else if (results.every((item) => !item.ok)) {
    status = "failed";
  }
  return { ok: true, status, checked_at: get_time(), probes: results };
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function normalize_diagnostics_host(input) {
  let value = String(input || "").trim();
  if (!value) return "";
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    value = "https://" + value;
  }
  try {
    const url = new URL(value);
    return (url.hostname || "").replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  } catch (err) {
    return String(input || "").trim().split("/")[0].replace(/\.$/, "").toLowerCase();
  }
}
function diagnostics_plain_host(host) {
  return String(host || "").indexOf(".") < 0;
}
function diagnostics_private_ip(ip) {
  return /^(::f{4}:)?10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(ip) || /^(::f{4}:)?192\.168\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(ip) || /^(::f{4}:)?172\.(1[6-9]|2\d|16|23|30|31)\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(ip) || /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(ip) || /^(::f{4}:)?169\.254\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(ip) || /^f[cd][0-9a-f]{2}:/i.test(ip) || /^fe80:/i.test(ip) || /^::1$/.test(ip) || /^::$/.test(ip);
}
function diagnostics_dns_domain_is(host, domain) {
  host = String(host || "").toLowerCase();
  domain = String(domain || "").toLowerCase();
  if (!domain) return false;
  return host.length >= domain.length && host.slice(host.length - domain.length) === domain;
}
function diagnostics_sh_exp_match(text, pattern) {
  const escaped = String(pattern || "").replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp("^" + escaped + "$", "i").test(String(text || ""));
}
function diagnostics_match_host(host, val) {
  return diagnostics_dns_domain_is(host, val) || diagnostics_sh_exp_match(host, val);
}
function diagnostics_direct_host(host) {
  if (diagnostics_plain_host(host) || diagnostics_private_ip(host)) return true;
  for (var i in diagnostics_direct_hosts) {
    if (diagnostics_match_host(host, diagnostics_direct_hosts[i])) return true;
  }
  return false;
}
function diagnostics_ip_to_number(ip) {
  if (!diagnostics_ipv4.test(ip)) return null;
  const parts = ip.split(".").map((part) => parseInt(part, 10));
  return (parts[0] << 24 >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3] >>> 0;
}
function diagnostics_geo_ip_rows() {
  if (diagnostics_geo_ips) return diagnostics_geo_ips;
  try {
    diagnostics_geo_ips = JSON.parse(geoip || "[]");
  } catch (err) {
    diagnostics_geo_ips = [];
  }
  return diagnostics_geo_ips;
}
function diagnostics_is_geoip_cn(ip) {
  const num = diagnostics_ip_to_number(ip);
  if (num === null) return false;
  const rows = diagnostics_geo_ip_rows();
  var left = 0;
  var right = rows.length;
  if (right === 0) return false;
  do {
    var mid = Math.floor((left + right) / 2);
    var ipf = (num & rows[mid][1]) >>> 0;
    var masked = (rows[mid][0] & rows[mid][1]) >>> 0;
    if (ipf === masked) {
      return true;
    } else if (ipf > masked) {
      left = mid + 1;
    } else {
      right = mid;
    }
  } while (left + 1 <= right);
  return false;
}
async function diagnostics_resolve_host(host) {
  if (diagnostics_ipv4.test(host)) return host;
  const servers = ["https://223.5.5.5/resolve", "https://223.6.6.6/resolve"];
  for (const server of servers) {
    try {
      const data = await fetch_json(server + "?type=A&name=" + encodeURIComponent(host), {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store"
      });
      const answers = data && Array.isArray(data.Answer) ? data.Answer : [];
      const answer = answers.find((item) => Number(item.type) === 1 && diagnostics_ipv4.test(item.data || ""));
      if (answer) return answer.data;
    } catch (err) {
      console.log("diagnostics resolve failed", host, error_message(err));
    }
  }
  return "";
}
function diagnostics_find_rule(rules, host) {
  rules = rules || {};
  for (var matcher in rules) {
    if (diagnostics_match_host(host, matcher)) {
      return { matcher, proxy: rules[matcher] };
    }
  }
  return null;
}
function diagnostics_route_from_proxy(value) {
  return String(value || "").toUpperCase().indexOf("DIRECT") === 0 ? "direct" : "proxy";
}
function diagnostics_mode_from_store(store) {
  const proxyMode = String(store.diagnostics_proxy_mode || "0");
  const config = store.diagnostics_proxy_config || {};
  if (config.mode) return config.mode;
  return {
    rule: proxyMode === "7",
    geoip: proxyMode === "7",
    global: proxyMode === "5" || proxyMode === "7"
  };
}
async function diagnose_host(input) {
  const host = normalize_diagnostics_host(input);
  if (!host) return { ok: false, message: "Invalid host" };
  const store = await storage_get(["diagnostics_proxy_config", "diagnostics_proxy_mode"]);
  const proxyMode = String(store.diagnostics_proxy_mode || "0");
  const config = store.diagnostics_proxy_config || {};
  const mode = diagnostics_mode_from_store(store);
  const hasConfig = !!store.diagnostics_proxy_config && typeof store.diagnostics_proxy_config === "object";
  if (proxyMode === "0") {
    return { ok: true, host, route: "direct", reason: "off" };
  }
  if (diagnostics_direct_host(host)) {
    return { ok: true, host, route: "direct", reason: "direct_host" };
  }
  if (!hasConfig) {
    return { ok: false, host, reason: "sync_pending", message: "Routing data is still syncing." };
  }
  if (config.proxy_test_urls && Object.prototype.hasOwnProperty.call(config.proxy_test_urls, host)) {
    return { ok: true, host, route: "proxy", reason: "proxy_test", proxy: config.proxy_test_urls[host] };
  }
  if (mode.rule) {
    const userRule = diagnostics_find_rule(config.proxy_rule_user, host);
    if (userRule) {
      return {
        ok: true,
        host,
        route: diagnostics_route_from_proxy(userRule.proxy),
        reason: "user_rule",
        matched_rule: userRule.matcher,
        proxy: userRule.proxy
      };
    }
    const systemRule = diagnostics_find_rule(config.proxy_rule, host);
    if (systemRule) {
      return {
        ok: true,
        host,
        route: diagnostics_route_from_proxy(systemRule.proxy),
        reason: "system_rule",
        matched_rule: systemRule.matcher,
        proxy: systemRule.proxy
      };
    }
  }
  if (mode.geoip) {
    const resolvedIp = await diagnostics_resolve_host(host);
    if (!resolvedIp) {
      return { ok: true, host, route: "proxy", reason: "geoip_proxy", proxy: config.proxy || "", resolved_ip: "" };
    }
    if (diagnostics_is_geoip_cn(resolvedIp)) {
      return { ok: true, host, route: "direct", reason: "geoip_direct", resolved_ip: resolvedIp };
    }
    return { ok: true, host, route: "proxy", reason: "geoip_proxy", proxy: config.proxy || "", resolved_ip: resolvedIp };
  }
  if (mode.global) {
    return { ok: true, host, route: "proxy", reason: "global", proxy: config.proxy || "" };
  }
  return { ok: true, host, route: "direct", reason: "default" };
}
async function fetch_site_probe(site) {
  const started = get_time();
  const urls = probe_urls(site);
  const errors = [];
  for (const url of urls) {
    try {
      const req = await fetch_external_with_timeout(url, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        redirect: "follow"
      }, 7e3);
      const reachable = probe_status_ok(url, req.status);
      if (!reachable) throw new Error("HTTP " + req.status);
      return {
        id: site.id,
        name: site.name,
        url,
        ok: true,
        reachable: true,
        elapsed_ms: get_time() - started
      };
    } catch (err) {
      errors.push(error_message(err));
    }
  }
  return {
    id: site.id,
    name: site.name,
    ok: false,
    reachable: false,
    message: errors.join("; ") || "Request failed",
    elapsed_ms: get_time() - started
  };
}
async function check_sites(sites) {
  const list = Array.isArray(sites) ? sites : [];
  const results = await Promise.all(list.map((site) => fetch_site_probe(site)));
  return { ok: true, checked_at: get_time(), sites: results };
}
async function get_speed_tester_result() {
  const store = await storage_get(["speed_tester"]);
  return { ok: true, speed_tester: store.speed_tester || {} };
}
async function run_diagnostics_speed_tester(testerList) {
  const store = await storage_get(["diagnostics_speed_tester"]);
  const list = Array.isArray(testerList) && testerList.length > 0 ? testerList : store.diagnostics_speed_tester || [];
  if (list.length > 0) {
    run_speed_tester(list);
    await sleep(3400);
  }
  return await get_speed_tester_result();
}
function handler_message(msg, sender, reply) {
  (async () => {
    if (typeof msg !== "object" || msg === null) {
      return reply({ error: 400 });
    }
    if (msg.hasOwnProperty("session")) {
      await set_chrome_settings(msg);
      return reply({ ok: true });
    }
    switch (msg.type) {
      case "getConfig": {
        const store = await storage_get(["token"]);
        return reply({
          apiPrefix: "/chrome/v2",
          token: store.token || null,
          version: manifest.version
        });
      }
      case "buildUrl":
        return reply(await build_url_for(msg.path, msg.query));
      case "rotateUrl":
        return reply(await rotate_url());
      case "setToken":
        await storage_set({ token: msg.token });
        return reply({ ok: true });
      case "clearToken":
        await new Promise((r) => chrome.storage.local.remove("token", r));
        return reply({ ok: true });
      case "refreshSession":
        chrome_session();
        return reply({ ok: true });
      case "checkExitIp":
        return reply(await check_exit_ip());
      case "diagnoseHost":
        return reply(await diagnose_host(msg.host || msg.url || ""));
      case "checkSites":
        return reply(await check_sites(msg.sites));
      case "getSpeedTester":
        return reply(await get_speed_tester_result());
      case "runSpeedTester":
        return reply(await run_diagnostics_speed_tester(msg.tester));
      case "nodeCheckHold":
        await storage_set({ node_check_hold: Date.now() + (msg.ms || 45e3) });
        return reply({ ok: true });
      case "nodeCheckRelease":
        await storage_set({ node_check_hold: 0 });
        await restore_normal_pac();
        return reply({ ok: true });
      default:
        if (msg.hasOwnProperty("path")) {
          return reply(await build_url_for(msg.path, msg.query));
        }
        return reply({ error: 404 });
    }
  })();
  return true;
}
remove_other_apps();
async_local_api_domains();
set_proxy_system();
chrome.storage.local.get(["proxy"], function(loc) {
  if (loc.hasOwnProperty("proxy")) {
    set_chrome_proxy_settings(loc.proxy);
  }
});
chrome.runtime.onMessage.addListener(handler_message);
chrome.alarms.onAlarm.addListener(cron_chrome_session);
cron_chrome_session();
