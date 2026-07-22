/**
 * Address Normalization Engine for Household Management System
 */

/**
 * Removes Vietnamese accents/diacritics from a string.
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip combining diacritical marks
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/**
 * Formats any coordinate representation (string, GeoJSON Point object, lat/lng object) into a safe display string.
 */
export function formatCoordinates(coords: any): string {
  if (!coords) return "";
  if (typeof coords === "string") return coords;
  if (typeof coords === "object") {
    if (Array.isArray(coords.coordinates) && coords.coordinates.length >= 2) {
      // GeoJSON Point: [lng, lat]
      const [lng, lat] = coords.coordinates;
      return `${lat}, ${lng}`;
    }
    if (typeof coords.lat === "number" && typeof coords.lng === "number") {
      return `${coords.lat}, ${coords.lng}`;
    }
    if (typeof coords.x === "number" && typeof coords.y === "number") {
      return `${coords.y}, ${coords.x}`;
    }
    try {
      return JSON.stringify(coords);
    } catch {
      return "";
    }
  }
  return String(coords);
}

/**
 * Fixes Mojibake (corrupted UTF-8 double-encoding) for Vietnamese text.
 */
export function fixMojibake(str?: string | null): string {
  if (!str || typeof str !== "string") return str || "";

  let result = str;

  // Try decoding double-encoded UTF-8 string via TextDecoder
  try {
    if (/[\u0080-\u00FF]/.test(result) || result.includes("á»") || result.includes("Æ°") || result.includes("Ä") || result.includes("Ã¡")) {
      const bytes = new Uint8Array(result.length);
      let isValidByteStream = true;
      for (let i = 0; i < result.length; i++) {
        const code = result.charCodeAt(i);
        if (code > 255) {
          isValidByteStream = false;
          break;
        }
        bytes[i] = code;
      }
      if (isValidByteStream) {
        const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
        if (decoded && !decoded.includes("\uFFFD") && decoded !== result) {
          result = decoded;
        }
      }
    }
  } catch (e) {
    // Ignore error and fall through to pattern replacement
  }

  // Regex replacement map for persistent Mojibake artifacts
  const patterns: [RegExp, string][] = [
    [/Há»™/g, "Hộ"],
    [/hộ/g, "hộ"],
    [/sá»‘/g, "số"],
    [/Sá»‘/g, "Số"],
    [/LÆ°Æ¡ng/g, "Lương"],
    [/Äï¿½nh/g, "Định"],
    [/Ä\u0090á»\u008bnh/g, "Định"],
    [/Ä\u0090/g, "Đ"],
    [/CÃ¡»§a/g, "Của"],
    [/PhÆ°á»\u009dn/g, "Phường"],
    [/PhÆ°á»ng/g, "Phường"],
    [/An PhÃº/g, "An Phú"],
    [/CÆ¡ sá»\u009f/g, "Cơ sở"],
    [/cÆ¡ sá»\u009f/g, "cơ sở"],
    [/Khu phÃ³/g, "Khu phố"],
    [/khu phÃ³/g, "khu phố"],
    [/Nguyá»\u0085n/g, "Nguyễn"],
    [/Tráº§n/g, "Trần"],
    [/LÃª/g, "Lê"],
    [/Pháº¡m/g, "Phạm"],
    [/HoÃ ng/g, "Hoàng"],
    [/Tá»•/g, "Tổ"],
    [/Kinh doanh sá»‘/g, "Kinh doanh số"],
    [/Kinh doanh sÃ¡Â»ï¿½/g, "Kinh doanh số"],
    [/HÃ¡Â»\u0090|HÃ¡Â»\u0081|HÃ¡Â»ï¿½/g, "Hộ"]
  ];

  for (const [re, rep] of patterns) {
    result = result.replace(re, rep);
  }

  return result;
}

/**
 * Normalizes an address string based on standardized local government rules.
 */
export function normalizeAddress(address: string): string {
  if (!address) return "";

  // 1. Remove accents and convert to UPPERCASE
  let clean = removeVietnameseAccents(address).toUpperCase();

  // 2. Replace commas, periods, hyphens with spaces, keeping alphanumeric and slashes '/'
  clean = clean.replace(/[^A-Z0-9\/]/g, " ");

  // 3. Remove noise words completely
  clean = clean.replace(/\b(SO NHA|SO|DIA CHI)\b/g, "");
  
  // Remove "TỔ <number>" completely (e.g. TO 02, TO 2)
  clean = clean.replace(/\bTO\s+\d+\b/g, "");

  // 4. Map dictionary terms:
  // "KHU PHỐ / KP / KHU PHO <number>" -> "KP<number>"
  clean = clean.replace(/\b(KHU PHO|KP)\s*(\d+)\b/g, "KP$2");
  // Remove standalone "KHU PHỐ" or "KP" if not followed by a number
  clean = clean.replace(/\b(KHU PHO|KP)\b/g, "");

  // "PHƯỜNG / P. <name>" -> "<name>" (Ward name prefix removal)
  clean = clean.replace(/\b(PHUONG|P)\s+(\w+)\b/g, "$2");
  // Remove standalone "PHUONG" or "P"
  clean = clean.replace(/\b(PHUONG|P)\b/g, "");

  // "ĐƯỜNG / DUONG / Đ. <name>" -> "D <name>" (Street prefix replacement)
  clean = clean.replace(/\b(DUONG|D)\b/g, "D");
  // Collapse D D<number> or D D <name> -> D<number> or D<name> (e.g., DUONG D2 -> D D2 -> D2)
  clean = clean.replace(/\bD\s+D(\d+)\b/g, "D$1");
  clean = clean.replace(/\bD\s+D\b/g, "D");

  // Place name mergers (remove spaces between multi-word name tokens or strip redundant cities)
  const mergers: { [key: string]: string } = {
    "AN PHU": "ANPHU",
    "AN KHANH": "ANKHANH",
    "THU DUC": "THUDUC",
    "HO CHI MINH": "",
    "TP HCM": "",
    "TP.HCM": "",
    "TPHCM": "",
    "SAI GON": "",
    "TINH": "",
    "VIET NAM": "",
    "VIETNAV": "",
    "VIETNAM": "",
    "DONG NAI": "DONGNAI"
  };

  // Collapse multiple whitespaces first to ensure exact word matches
  clean = clean.replace(/\s+/g, " ").trim();

  // Apply place name mergers
  for (const [key, val] of Object.entries(mergers)) {
    const regex = new RegExp("\\b" + key + "\\b", "g");
    clean = clean.replace(regex, val);
  }

  // Final space collapse and trim
  clean = clean.replace(/\s+/g, " ").trim();

  return clean;
}

/**
 * Calculates the Levenshtein distance between two strings.
 */
export function getLevenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculates similarity ratio between two strings using Levenshtein distance.
 * Returns value between 0.0 (totally different) and 1.0 (identical).
 */
export function getSimilarity(s1: string, s2: string): number {
  const norm1 = normalizeAddress(s1);
  const norm2 = normalizeAddress(s2);

  if (norm1 === norm2) return 1.0;

  const tokens1 = norm1.split(" ");
  const tokens2 = norm2.split(" ");

  // If first tokens (house numbers, e.g. "42/3" vs "42/3A") are different, they are separate properties (similarity 0.0)
  if (tokens1[0] && tokens2[0] && tokens1[0] !== tokens2[0]) {
    return 0.0;
  }

  // If first token (house number, e.g. "57/B1") matches
  if (tokens1[0] && tokens2[0] && tokens1[0] === tokens2[0]) {
    const rest1 = tokens1.slice(1).join(" ");
    const rest2 = tokens2.slice(1).join(" ");

    // If one of them has no street/block details (just the house number, e.g. "57/B1")
    if (rest1 === "" || rest2 === "") {
      return 1.0;
    }

    // Check if they contradict on street name (e.g. D1 vs D2)
    const street1 = tokens1.find(t => /^D\d+$/.test(t));
    const street2 = tokens2.find(t => /^D\d+$/.test(t));
    if (street1 && street2 && street1 !== street2) {
      return 0.0; // Different streets!
    }

    // If one rest contains the other (e.g. "D1 KP3 ANPHU" contains "D1 KP3")
    if (rest1.includes(rest2) || rest2.includes(rest1)) {
      return 1.0;
    }
  }

  const distance = getLevenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);

  if (maxLength === 0) return 1.0;
  return 1.0 - distance / maxLength;
}

/**
 * Checks if two address strings match under the given similarity threshold.
 */
export function isMatchingAddress(s1: string, s2: string, threshold = 0.95): boolean {
  return getSimilarity(s1, s2) >= threshold;
}

/**
 * Generates an SVG data URL containing initials of the resident.
 * This is used as a beautiful local offline fallback when the external image fails to load.
 */
export function getInitialsSvg(name: string, gender: "Nam" | "Nữ"): string {
  const cleanName = name.replace(/^(Ông|Bà|Anh|Chị)\s+/i, "").trim();
  const words = cleanName.split(/\s+/);
  let initials = "";
  if (words.length >= 2) {
    initials = (words[words.length - 2][0] || "") + (words[words.length - 1][0] || "");
  } else if (words.length === 1 && words[0]) {
    initials = words[0].slice(0, 2);
  }
  initials = initials.toUpperCase();
  if (!initials) initials = "AV";
  
  // Use pink for female, emerald/teal for male
  const bg = gender === "Nữ" ? "%23fdf2f8" : "%23ecfdf5"; // pink-50 vs emerald-50
  const text = gender === "Nữ" ? "%23db2777" : "%23059669"; // pink-600 vs emerald-600
  
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="${bg}" rx="50"/><text x="50%" y="54%" font-size="34" font-family="sans-serif" font-weight="bold" fill="${text}" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
}
