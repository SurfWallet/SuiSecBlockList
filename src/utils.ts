import fetch from "cross-fetch";
import {
  Action,
  CoinBlocklist,
  DomainBlocklist,
  ObjectBlocklist,
  PackageBlocklist,
} from "./types";

export const DEFAULT_BLOCKLIST_URL =
  "https://raw.githubusercontent.com/suiet/guardians/main/dist/domain-list.json";
export const DEFAULT_COIN_URL =
  "https://raw.githubusercontent.com/suiet/guardians/main/dist/coin-list.json";
export const DEFAULT_PACKAGE_URL =
  "https://raw.githubusercontent.com/suiet/guardians/main/dist/package-list.json";
export const DEFAULT_OBJECT_URL =
  "https://raw.githubusercontent.com/suiet/guardians/main/dist/object-list.json";

export type ErrorCallback = (error: unknown) => void;

interface DomainMap {
  [key: string]: string;
}

const domainMap: DomainMap = {
  "cetus": "cetus.zone",
  "scallop": "scallop.io",
  "navi": "naviprotocol.io",
  "navx": "naviprotocol.io",
  "suilend": "suilend.fi",
  "bucket": "bucketprotocol.io",
  "turbos": "turbos.finance",
  "flowx": "flowx.finance",
  "kriya": "kriya.finance",
  "typus": "typus.finance",
  "aftermath": "aftermath.finance",
  "bluefin": "bluefin.io",
  "haedal": "haedal.xyz",
  "volo": "volosui.com",
  "volo.fi": "volo.fi",//will redirected to volosui.com
  "alphafi": "alphafi.xyz",
  "deepbook": "deepbook.tech",
  "suins": "suins.io",
  "suilink": "suilink.io",
  "sui": "sui.io",
};

// Use native fetch where supported
// cross-fetch doesn't support workers (https://github.com/lquixada/cross-fetch/issues/78)
export const fetcher = typeof self !== "undefined" && !!self.fetch
  ? self.fetch
  : fetch;

// recent domains every 5 minutes.
export async function fetchDomainBlocklist(
  reportError: ErrorCallback | undefined = undefined,
): Promise<DomainBlocklist | null> {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    // We wrap errors with a null so any downtime won't break user's browsing flow.
    const response = await fetcher(DEFAULT_BLOCKLIST_URL, {
      method: "GET",
      ...headers,
    });
    if (!response.ok) {
      if (reportError) {
        reportError(await response.text());
      }
      return null;
    }
    // Catch JSON decoding errors too.
    return (await response.json()) as DomainBlocklist;
  } catch (error: unknown) {
    if (reportError) {
      reportError(error);
    }
    return null;
  }
}

export function scanDomain(suiseclist: DomainBlocklist, url: string): Action {
  url =url.trim();
  // parse domain of https://example.com or http://example.com  or example.com , then domain is example.com
  const domain = url.toLowerCase().startsWith("http")? new URL(url).hostname.toLowerCase():  new URL(`https://${url}`).hostname.toLowerCase();
  const domainParts = domain.split(".");

  for (let i = 0; i < domainParts.length - 1; i++) {
    const domainToLookup = domainParts.slice(i).join(".");
    if (suiseclist.allowlist.includes(domainToLookup)) {
        return Action.NONE;
    }
    if (suiseclist.blocklist.includes(domainToLookup)) {
      return Action.BLOCK;
    }
  }

  for (const key in domainMap) {
    let whitelistDomain = domainMap[key].toLowerCase();
    let whitelistDomainParts = whitelistDomain.split(".");

    let slice = domainParts.slice(-whitelistDomainParts.length);
    //https://deepbook.cetus.zone is NOT-BLOCK
    if(slice.join('.') === whitelistDomain){
      return Action.NONE;
    }
  }

  for (const key in domainMap) {
    if (domain.includes(key)) {
      let whitelistDomain = domainMap[key].toLowerCase();
      if (domainParts.length == whitelistDomain.split(".").length){
        //scam-aaa.com
        return domain !== whitelistDomain ? Action.BLOCK : Action.NONE;
      } else if (!domain.endsWith(`.${whitelistDomain}`)) {
        //app.scam-aaa.com
        return Action.BLOCK;
      }
    }
  }
  return Action.NONE;
}

export const withRetry = async <T>(
  action: () => Promise<T>,
  times = 3,
): Promise<T> => {
  try {
    return action();
  } catch (e) {
    if (times <= 0) {
      throw e;
    }
    return withRetry(action, times - 1);
  }
};

export async function fetchPackageBlocklist(
  reportError: ErrorCallback | undefined = undefined,
): Promise<PackageBlocklist | null> {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    // We wrap errors with a null so any downtime won't break user's browsing flow.
    const response = await fetcher(DEFAULT_PACKAGE_URL, {
      method: "GET",
      ...headers,
    });
    if (!response.ok) {
      if (reportError) {
        reportError(await response.text());
      }
      return null;
    }
    // Catch JSON decoding errors too.
    return (await response.json()) as PackageBlocklist;
  } catch (error: unknown) {
    if (reportError) {
      reportError(error);
    }
    return null;
  }
}

export function scanPackage(packagelist: string[], address: string): Action {
  if (packagelist.includes(address)) {
    return Action.BLOCK;
  }

  return Action.NONE;
}

export async function fetchObjectBlocklist(
  reportError: ErrorCallback | undefined = undefined,
): Promise<ObjectBlocklist | null> {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    // We wrap errors with a null so any downtime won't break user's browsing flow.
    const response = await fetcher(DEFAULT_OBJECT_URL, {
      method: "GET",
      ...headers,
    });
    if (!response.ok) {
      if (reportError) {
        reportError(await response.text());
      }
      return null;
    }
    // Catch JSON decoding errors too.
    return (await response.json()) as ObjectBlocklist;
  } catch (error: unknown) {
    if (reportError) {
      reportError(error);
    }
    return null;
  }
}

export function scanObject(objectlist: ObjectBlocklist, object: string): Action {
  if (objectlist.allowlist.includes(object)) {
    return Action.NONE;
  }
  if (objectlist.blocklist.includes(object)) {
    return Action.BLOCK;
  }

  return Action.NONE;
}

export async function fetchCoinBlocklist(
  reportError: ErrorCallback | undefined = undefined,
): Promise<CoinBlocklist | null> {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    // We wrap errors with a null so any downtime won't break user's browsing flow.
    const response = await fetcher(DEFAULT_COIN_URL, {
      method: "GET",
      ...headers,
    });
    if (!response.ok) {
      if (reportError) {
        reportError(await response.text());
      }
      return null;
    }
    // Catch JSON decoding errors too.
    return (await response.json()) as CoinBlocklist;
  } catch (error: unknown) {
    if (reportError) {
      reportError(error);
    }
    return null;
  }
}

export function scanCoin(coinlist: string[], coin: string): Action {
  if (coinlist.includes(coin)) {
    return Action.BLOCK;
  }

  return Action.NONE;
}
