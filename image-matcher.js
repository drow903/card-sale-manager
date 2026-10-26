/* Card Sale Manager 2.1 deterministic image matcher.
 * Matching is based on eligibility gates and named evidence, not a percentage.
 */
(function imageMatcherModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CSMImageMatcher = api;
})(typeof window !== "undefined" ? window : globalThis, function createImageMatcher() {
  const GENERIC_NAME_TOKENS = new Set(["card", "team", "leaders", "leader", "rookies", "rookie", "combo", "checklist"]);
  const NAME_SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv"]);

  function normalizeText(value) {
    return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }

  function normalizeCardNumber(value) {
    const compact = normalizeText(value).replace(/\s+/g, "").replace(/^#/, "");
    if (!compact) return "";
    return compact.replace(/\d+/g, (digits) => String(Number(digits)));
  }

  function validDateCode(value) {
    if (!/^\d{8}$/.test(String(value || ""))) return false;
    const code = String(value);
    const month = Number(code.slice(0, 2));
    const day = Number(code.slice(2, 4));
    const year = Number(code.slice(4));
    if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return false;
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  function normalizeDate(value) {
    if (value == null || value === "") return "";
    const raw = String(value).trim();
    const digits = raw.replace(/\D/g, "");
    if (/^\d{6}$/.test(digits)) {
      const year = Number(digits.slice(4)) >= 70 ? 1900 + Number(digits.slice(4)) : 2000 + Number(digits.slice(4));
      const code = `${digits.slice(0, 4)}${year}`;
      return validDateCode(code) ? code : "";
    }
    if (/^\d{7}$/.test(digits)) {
      const options = dateOptions(digits);
      return options.length === 1 ? options[0] : "";
    }
    if (/^\d{8}$/.test(digits)) {
      const yearFirst = Number(digits.slice(0, 4));
      const code = yearFirst >= 1900 && yearFirst <= 2200 ? `${digits.slice(4, 6)}${digits.slice(6, 8)}${digits.slice(0, 4)}` : digits;
      return validDateCode(code) ? code : "";
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return "";
    const code = `${String(parsed.getMonth() + 1).padStart(2, "0")}${String(parsed.getDate()).padStart(2, "0")}${parsed.getFullYear()}`;
    return validDateCode(code) ? code : "";
  }

  function dateOptions(digits) {
    const raw = String(digits || "");
    const options = [];
    if (/^\d{6}$/.test(raw)) {
      const year = Number(raw.slice(4)) >= 70 ? 1900 + Number(raw.slice(4)) : 2000 + Number(raw.slice(4));
      const code = `${raw.slice(0, 4)}${year}`;
      if (validDateCode(code)) options.push(code);
    } else if (/^\d{7}$/.test(raw)) {
      const year = raw.slice(3);
      const monthOne = `0${raw[0]}${raw.slice(1, 3)}${year}`;
      const dayOne = `${raw.slice(0, 2)}0${raw[2]}${year}`;
      if (validDateCode(monthOne)) options.push(monthOne);
      if (validDateCode(dayOne)) options.push(dayOne);
    } else if (/^\d{8}$/.test(raw)) {
      const direct = raw;
      const yearFirst = `${raw.slice(4, 6)}${raw.slice(6, 8)}${raw.slice(0, 4)}`;
      if (validDateCode(direct)) options.push(direct);
      if (validDateCode(yearFirst)) options.push(yearFirst);
    }
    return [...new Set(options)];
  }

  function extractDateInfo(image) {
    const groups = String(image?.stem || image?.name || "").match(/\d{6,8}/g) || [];
    const options = groups.flatMap(dateOptions);
    return { groups, codes: [...new Set(options)], ambiguous: groups.some((group) => dateOptions(group).length > 1) };
  }

  function expectedYear(value) {
    const years = String(value || "").match(/(?:18|19|20)\d{2}/g) || [];
    return years.length ? String(Math.min(...years.map(Number))) : normalizeText(value).split(" ")[0] || "";
  }

  function yearTokens(value) {
    return [...new Set((String(value || "").match(/(?:18|19|20)\d{2}/g) || []))];
  }

  function pathFolderYears(image, expected = "") {
    const relative = String(image?.relativePath || image?.path || "").replace(/\\/g, "/");
    const generic = new Set(["card", "cards", "image", "images", "scan", "scans", "photo", "photos", "baseball", "football", "basketball", "hockey"]);
    const found = [];
    relative.split("/").slice(0, -1).forEach((folder) => {
      const normalized = normalizeText(folder);
      const fourDigit = yearTokens(normalized);
      if (fourDigit.length === 1) {
        const remaining = normalized.replace(fourDigit[0], " ").split(" ").filter(Boolean);
        if (!remaining.length || remaining.every((token) => generic.has(token))) found.push(fourDigit[0]);
      }
      if (expected && /^\d{2}(?:\s+(?:card|cards|image|images|scan|scans|photo|photos))?$/.test(normalized) && normalized.slice(0, 2) === String(expected).slice(-2)) found.push(String(expected));
    });
    return [...new Set(found)];
  }

  function expectedSport(value) {
    const sport = normalizeText(value);
    return ["football", "basketball", "hockey"].includes(sport) ? sport : "";
  }

  function sportAliases(input = {}) {
    const defaults = { football: ["football", "nfl"], basketball: ["basketball", "nba"], hockey: ["hockey", "nhl"] };
    return Object.fromEntries(Object.entries(defaults).map(([sport, fallback]) => {
      const provided = Array.isArray(input?.[sport]) ? input[sport] : [];
      return [sport, [...new Set([...fallback, ...provided].map(normalizeText).filter(Boolean))]];
    }));
  }

  function pathFolderSports(image, inputAliases = {}) {
    const relative = String(image?.relativePath || image?.path || "").replace(/\\/g, "/");
    const segments = relative.split("/").slice(0, -1).map(normalizeText);
    const aliases = sportAliases(inputAliases);
    return Object.entries(aliases).filter(([, names]) => segments.some((segment) => names.some((name) => segment === name || segment === `${name} cards` || segment === `${name} images`))).map(([sport]) => sport);
  }

  function filenameYears(image) {
    const stem = String(image?.stem || image?.name || "");
    const withoutDates = (stem.match(/\d{6,8}/g) || []).reduce((value, dateCode) => value.replace(dateCode, " "), stem);
    return yearTokens(withoutDates);
  }

  function nameParts(name) {
    const normalized = normalizeText(name);
    const tokens = normalized.split(" ").filter((token) => token && !NAME_SUFFIXES.has(token));
    const significant = tokens.filter((token) => token.length > 1 && !GENERIC_NAME_TOKENS.has(token));
    const rawSegments = String(name || "").split(/\s*(?:\/|&|\band\b|;)\s*/i);
    const surnames = rawSegments.map((segment) => normalizeText(segment).split(" ").filter((token) => token && !NAME_SUFFIXES.has(token)).pop()).filter(Boolean);
    if (!surnames.length && significant.length) surnames.push(significant[significant.length - 1]);
    const teamLike = /\bteam\b/i.test(String(name || "")) || tokens.some((token) => ["yankees", "dodgers", "cardinals", "cubs", "mets", "sox"].includes(token));
    return { normalized, tokens, significant, surnames: [...new Set(surnames)], teamLike };
  }

  function detectName(card, image) {
    const info = nameParts(card?.name);
    const stem = normalizeText(image?.stem || image?.name || "");
    const tokens = stem.split(" ").filter(Boolean);
    const allSignificant = info.significant.length > 1 && info.significant.every((token) => tokens.includes(token));
    const surname = info.surnames.find((token) => tokens.includes(token));
    const aliasTail = info.significant.length > 1 && info.significant.slice(-2).every((token) => tokens.includes(token));
    const initialSurname = info.surnames.some((last) => {
      const lastIndex = tokens.indexOf(last);
      return lastIndex > 0 && tokens[lastIndex - 1].length === 1;
    });
    if (allSignificant) return { matched: true, kind: info.teamLike && aliasTail ? "team alias" : "full player name", strength: 4 };
    if (info.teamLike && (aliasTail || info.significant.some((token) => tokens.includes(token)))) return { matched: true, kind: "team alias", strength: aliasTail ? 4 : 3 };
    if (initialSurname) return { matched: true, kind: "initial and surname", strength: 2 };
    if (surname) return { matched: true, kind: "surname", strength: 3 };
    return { matched: false, kind: "", strength: 0 };
  }

  function sequenceNumber(image, card) {
    const stem = String(image?.stem || image?.name || "");
    const explicit = stem.match(/(?:copy|card|item|scan)\s*[-_ ]*0*(\d+)\s*$/i) || stem.match(/\(\s*0*(\d+)\s*\)\s*$/);
    if (explicit) return Number(explicit[1]);
    const ofTotal = stem.match(/(?:^|[^\d])0*(\d+)\s+of\s+\d+\s*$/i);
    if (ofTotal) return Number(ofTotal[1]);
    const dates = extractDateInfo(image);
    const afterDate = stem.match(/\d{6,8}[^\d]+0*(\d+)\s*$/);
    if (dates.groups.length && afterDate) return Number(afterDate[1]);
    const cardNumber = normalizeCardNumber(card?.number);
    if (cardNumber) {
      const parts = normalizeText(stem).split(" ").filter(Boolean);
      const cardIndex = parts.findIndex((token) => normalizeCardNumber(token) === cardNumber);
      if (cardIndex >= 0 && parts.length > cardIndex + 1 && /^\d+$/.test(parts.at(-1))) return Number(parts.at(-1));
      const trailing = stem.match(/[-_ ]0*(\d+)\s*$/);
      if (trailing && normalizeCardNumber(trailing[1]) !== cardNumber) return Number(trailing[1]);
    }
    return null;
  }

  function detectSide(image, card, mode = "single") {
    const tokens = normalizeText(image?.stem || image?.name || "").split(" ").filter(Boolean);
    if (tokens.includes("back") || tokens.includes("reverse")) return "back";
    if (tokens.includes("front") || tokens.includes("obverse")) return "front";
    if (tokens.some((token, index) => ["side", "scan"].includes(token) && tokens[index + 1] === "2")) return "back";
    if (tokens.some((token, index) => ["side", "scan"].includes(token) && tokens[index + 1] === "1")) return "front";
    if (mode === "front-back") {
      const number = normalizeCardNumber(card?.number);
      const numberSuffixAtEnd = number && ["a", "b"].includes(tokens.at(-1)) && number.endsWith(tokens.at(-1)) && tokens.slice(-2).join("") === number;
      const remaining = tokens.filter((token) => normalizeCardNumber(token) !== number);
      const hasFront = remaining.includes("f") || (remaining.includes("a") && !numberSuffixAtEnd);
      const hasBack = remaining.includes("b") && !numberSuffixAtEnd;
      if (numberSuffixAtEnd && remaining.at(-1) === tokens.at(-1)) remaining.pop();
      if (hasFront !== hasBack) return hasFront ? "front" : "back";
    }
    return "";
  }

  function candidateNumberTokens(image) {
    const stem = String(image?.stem || image?.name || "");
    const dateGroups = new Set(extractDateInfo(image).groups);
    const years = new Set(filenameYears(image));
    return normalizeText(stem).split(" ").filter((token) => {
      if (!/^[a-z]*\d+[a-z]*$/.test(token)) return false;
      if (dateGroups.has(token) || years.has(token)) return false;
      return true;
    });
  }

  function detectNumber(card, image) {
    const expected = normalizeCardNumber(card?.number);
    if (!expected) return { matched: false, conflict: false, tokens: [] };
    const tokens = candidateNumberTokens(image);
    const stemTokens = normalizeText(image?.stem || image?.name || "").split(" ").filter(Boolean);
    const dateGroups = new Set(extractDateInfo(image).groups);
    const years = new Set(filenameYears(image));
    const comparable = stemTokens.filter((token) => !dateGroups.has(token) && !years.has(token));
    const combinations = [];
    for (let start = 0; start < comparable.length; start += 1) {
      for (let length = 1; length <= 3 && start + length <= comparable.length; length += 1) {
        const value = comparable.slice(start, start + length).join("");
        if (/\d/.test(value) && value.length <= expected.length + 2) combinations.push(normalizeCardNumber(value));
      }
    }
    const matched = combinations.includes(expected);
    const pureNumeric = tokens.filter((token) => /^\d+$/.test(token));
    return { matched, conflict: !matched && pureNumeric.length > 0, tokens };
  }

  function detectBrand(card, image) {
    const brandTokens = normalizeText(card?.set).split(" ").filter((token) => token.length > 2);
    const haystack = normalizeText(`${image?.stem || ""} ${image?.relativePath || ""}`).split(" ");
    return brandTokens.length > 0 && brandTokens.some((token) => haystack.includes(token));
  }

  function evaluateCandidate({ card, image, sale, slot = "single", cards = [], folderAliases = {} }) {
    const mode = sale?.imageMode === "front-back" ? "front-back" : "single";
    const expected = expectedYear(card?.year);
    const folderYears = pathFolderYears(image, expected);
    const fileYears = filenameYears(image);
    const folderMatch = Boolean(expected && folderYears.includes(expected));
    const sport = expectedSport(card?.sport);
    const sportFolderMatch = Boolean(sport && folderYears.length === 0 && pathFolderSports(image, folderAliases).includes(sport));
    const fileYearMatch = Boolean(expected && fileYears.includes(expected));
    const fileYearConflict = Boolean(expected && fileYears.some((year) => year !== expected));
    const date = normalizeDate(card?.purchaseDate);
    const dates = extractDateInfo(image);
    const dateMatch = Boolean(date && dates.codes.includes(date));
    const dateConflict = Boolean(date && dates.codes.length && !dateMatch);
    const side = detectSide(image, card, mode);
    const sideConflict = mode === "single" ? side === "back" : slot === "back" ? side !== "back" : side === "back";
    const sideNeedsReview = mode === "front-back" && slot === "front" && !side;
    const name = detectName(card, image);
    const number = detectNumber(card, image);
    const brandMatch = detectBrand(card, image);
    const reasons = [];
    const reviewReasons = [];
    const rejectionReasons = [];
    if (folderMatch) reasons.push("expected year folder");
    if (sportFolderMatch) reasons.push(`${sport} fallback folder`);
    if (fileYearMatch) reasons.push("filename year");
    if (name.matched) reasons.push(name.kind);
    if (number.matched) reasons.push("card number");
    if (dateMatch) reasons.push("purchase date");
    if (brandMatch) reasons.push("brand");
    if (side) reasons.push(`${side} marker`);
    if (image?.readable === false) rejectionReasons.push("image file is unreadable");
    if ((expected || sport) && !folderMatch && !sportFolderMatch) rejectionReasons.push(expected ? (sport ? `not inside the ${expected} year folder or ${sport} fallback folder` : `not inside the ${expected} year folder`) : `not inside the ${sport} fallback folder`);
    if (sportFolderMatch && fileYearConflict) rejectionReasons.push("filename year conflicts with the card year in the sport fallback folder");
    if (dateConflict) rejectionReasons.push("purchase date conflicts");
    if (sideConflict) rejectionReasons.push(slot === "back" ? "not identified as a back image" : "identified as a back image");
    if (!name.matched && !number.matched) rejectionReasons.push("player/team and card number do not match");
    if (number.conflict) rejectionReasons.push("card number conflicts");
    if (fileYearConflict) reviewReasons.push("filename year conflicts with the folder/card year");
    if (dates.ambiguous && !dateMatch) reviewReasons.push("filename contains an ambiguous date");
    if (sideNeedsReview) reviewReasons.push("front/back sale file has no side marker");
    if (name.kind === "initial and surname" && !(number.matched && dateMatch)) reviewReasons.push("initial and surname need card-number/date support");
    const sportFallbackStrong = !sportFolderMatch || dateMatch || fileYearMatch || number.matched || name.strength >= 4;
    if (!sportFallbackStrong) reviewReasons.push(`${sport} fallback has only a surname; add a card number, purchase date, filename year, or full player name to auto-confirm`);
    const sameYearCards = cards.filter((item) => expectedYear(item.year) === expected);
    const numberUnique = number.matched && sameYearCards.filter((item) => normalizeCardNumber(item.number) === normalizeCardNumber(card.number)).length === 1;
    const surnameKeys = nameParts(card.name).surnames;
    const nameUnique = name.matched && sameYearCards.filter((item) => nameParts(item.name).surnames.some((surname) => surnameKeys.includes(surname))).length === 1;
    const identityStrength = name.matched && number.matched ? 5 : (name.matched && dateMatch) || (number.matched && dateMatch) ? 4 : name.matched && nameUnique ? 3 : number.matched && numberUnique ? 3 : name.matched || number.matched ? 2 : 0;
    if (identityStrength < 3) reviewReasons.push("filename does not uniquely identify one sale card");
    const sequence = sequenceNumber(image, card);
    const rank = (folderMatch ? 100000 : sportFolderMatch ? 90000 : 0) + identityStrength * 10000 + (dateMatch ? 2000 : 0) + (fileYearMatch ? 500 : 0) + (sequence != null ? 300 : 0) + (brandMatch ? 100 : 0) + (side ? 25 : 0);
    return {
      image, eligible: rejectionReasons.length === 0, rejected: rejectionReasons.length > 0,
      rejectionReason: rejectionReasons.join("; "), rejectionReasons, reasons, reviewReasons,
      folderMatch, sportFolderMatch, fileYearMatch, fileYearConflict, dateMatch, dateConflict, side, sideNeedsReview,
      nameMatch: name.matched, nameKind: name.kind, numberMatch: number.matched, brandMatch,
      sequence, identityStrength, rank,
      quality: identityStrength >= 5 ? "Exact identity" : dateMatch ? "Date-supported match" : nameUnique ? "Unique player/team" : numberUnique ? "Unique card number" : "Needs review"
    };
  }

  function duplicateKey(card) {
    return [expectedYear(card?.year), normalizeText(card?.set), normalizeCardNumber(card?.number), normalizeText(card?.name), normalizeDate(card?.purchaseDate) || "undated"].join("|");
  }

  function propose({ card, images, sale, slot = "single", folderAliases = {} }) {
    const cards = sale?.cards || [];
    const evaluated = images.map((image) => evaluateCandidate({ card, image, sale, slot, cards, folderAliases }));
    const rejectedCandidates = evaluated.filter((item) => item.rejected).sort((a, b) => String(a.image.path).localeCompare(String(b.image.path), undefined, { numeric: true }));
    let candidates = evaluated.filter((item) => item.eligible).sort((a, b) => b.rank - a.rank || String(a.image.path).localeCompare(String(b.image.path), undefined, { numeric: true }));
    const expectedFolder = candidates.filter((item) => item.folderMatch);
    const sportFolder = candidates.filter((item) => item.sportFolderMatch);
    if (expectedFolder.length) candidates = expectedFolder;
    else if (sportFolder.length) candidates = sportFolder;
    const bestRank = candidates[0]?.rank;
    const plausible = candidates.filter((item) => item.rank >= bestRank - 500);
    candidates = candidates.slice(0, 12);
    const duplicates = cards.filter((item) => duplicateKey(item) === duplicateKey(card));
    const duplicateIndex = Math.max(0, duplicates.findIndex((item) => item.id === card.id));
    const duplicateReview = duplicates.length > 1;
    if (duplicateReview) {
      candidates.sort((a, b) => {
        const aSequence = a.sequence === duplicateIndex + 1 ? 1 : 0;
        const bSequence = b.sequence === duplicateIndex + 1 ? 1 : 0;
        return bSequence - aSequence || b.rank - a.rank || String(a.image.path).localeCompare(String(b.image.path), undefined, { numeric: true });
      });
    }
    const top = candidates[0];
    const automatic = Boolean(top && candidates.length === 1 && (top.folderMatch || top.sportFolderMatch) && !top.reviewReasons.length && !duplicateReview);
    const reviewReasons = [...new Set([...(top?.reviewReasons || []), ...(duplicateReview ? ["identical copies require group review"] : []), ...(plausible.length > 1 ? ["more than one eligible file remains"] : [])])];
    return {
      card, sale, slot, candidates, rejectedCandidates, automatic,
      automaticReason: automatic ? top.quality : "",
      duplicateKey: duplicateKey(card), duplicateIndex, duplicateTotal: duplicates.length,
      conflict: duplicateReview || plausible.length > 1,
      conflictReason: reviewReasons.join(". "),
      status: automatic ? "confirmed-automatically" : top ? (duplicateReview || plausible.length > 1 ? "needs-review" : "strong-suggestion") : rejectedCandidates.length ? "file-conflict" : "missing-image"
    };
  }

  return {
    normalizeText, normalizeCardNumber, normalizeDate, validDateCode, dateOptions, extractDateInfo,
    expectedYear, pathFolderYears, expectedSport, sportAliases, pathFolderSports, filenameYears, nameParts, detectName, sequenceNumber, detectSide,
    duplicateKey, evaluateCandidate, propose
  };
});
