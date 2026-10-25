const assert = require("assert");
const matcher = require("./image-matcher");

function card(id, name, number, purchaseDate, year = "1959", set = "Topps") {
  return { id, name, number, purchaseDate, year, set };
}

function image(fileName, folder = "1959") {
  const name = `${fileName}.png`;
  return { path: `C:\\Cards\\${folder}\\${name}`, name, stem: fileName, relativePath: `${folder}\\${name}`, readable: true };
}

const cards = [
  card("h1", "Whitey Herzog", "438", "05/16/2026"),
  card("h2", "Whitey Herzog", "438", "07/18/2026"),
  card("r1", "Robin Roberts", "90", "07/18/2026"),
  card("w1", "Early Wynn", "100", "09/13/2026"),
  card("s1", "Duke Snider", "88", ""),
  card("a1", "Luis Aparicio", "483", "09/13/2026"),
  card("a2", "Luis Aparicio", "483", "09/13/2026")
];
const images = [
  image("Herzog-438-051626"), image("Herzog-438-071826"), image("Roberts-90-071826"),
  image("Wynn-100-091326"), image("Snider-88"), image("Aparicio-483-091326-1"), image("Aparicio-483-091326-2")
];
const sale = { imageMode: "single", cards };

for (const id of ["h1", "h2", "r1", "w1", "s1"]) {
  const result = matcher.propose({ card: cards.find((item) => item.id === id), images, sale });
  assert.equal(result.automatic, true, `${id} should auto-confirm`);
  assert.equal(result.candidates.length, 1, `${id} should have one eligible candidate`);
}

for (const id of ["a1", "a2"]) {
  const result = matcher.propose({ card: cards.find((item) => item.id === id), images, sale });
  assert.equal(result.automatic, false, `${id} duplicate should require review`);
  assert.equal(result.status, "needs-review");
  assert.equal(result.duplicateTotal, 2);
}

assert.equal(matcher.normalizeCardNumber("#001"), "1");
assert.equal(matcher.normalizeCardNumber("US-020"), "us20");
assert.equal(matcher.normalizeCardNumber("T-65"), "t65");
assert.equal(matcher.normalizeCardNumber("20-A"), "20a");
assert.equal(matcher.detectSide(image("Mantle-20B"), card("x", "Mickey Mantle", "20B", ""), "front-back"), "");
assert.equal(matcher.detectSide(image("Mantle-20-Back"), card("x", "Mickey Mantle", "20", ""), "front-back"), "back");
assert.equal(matcher.evaluateCandidate({ card: card("x", "Test Player", "US-20", ""), image: image("Player-US-20"), sale, cards: [] }).numberMatch, true);
assert.equal(matcher.evaluateCandidate({ card: card("x", "Test Player", "20-A", ""), image: image("Player-20-A"), sale, cards: [] }).numberMatch, true);

const wrongDate = matcher.evaluateCandidate({ card: cards[0], image: image("Herzog-438-071826"), sale, cards });
assert.equal(wrongDate.rejected, true);
assert.match(wrongDate.rejectionReason, /purchase date conflicts/);

const wrongFolder = matcher.propose({ card: cards[0], images: [image("Herzog-438-051626", "1960")], sale });
assert.equal(wrongFolder.automatic, false);
assert.match(wrongFolder.conflictReason, /outside the expected year folder/);

console.log("Image matcher checks passed.");
