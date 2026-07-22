import { normalizeAddress, getSimilarity, isMatchingAddress } from "../utils/addressEngine";

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${message}\nExpected: "${expected}"\nActual:   "${actual}"`);
  }
  console.log(`PASS: ${message}`);
}

function runTests() {
  console.log("=== RUNNING UNIT TESTS FOR ADDRESS NORMALIZATION ENGINE ===");

  try {
    // 1. Test basic normalization
    assertEqual(
      normalizeAddress("SỐ NHÀ 12/B2, ĐƯỜNG D2, TỔ 02, KHU PHỐ 3, Phường An Phú"),
      "12/B2 D2 KP3 ANPHU",
      "Example 1 normalization"
    );

    assertEqual(
      normalizeAddress("12/B2, khu phố 3, Phường An Phú"),
      "12/B2 KP3 ANPHU",
      "Example 2 normalization"
    );

    assertEqual(
      normalizeAddress("12/B2, DƯỜNG D2, TỔ 02, KHU PHỐ 3"),
      "12/B2 D2 KP3",
      "Example 3 normalization"
    );

    // 2. Test dictionary mapping
    assertEqual(
      normalizeAddress("KHU PHỐ 3"),
      "KP3",
      "KHU PHỐ -> KP"
    );

    assertEqual(
      normalizeAddress("ĐƯỜNG D2"),
      "D2",
      "ĐƯỜNG D2 -> D2 (collapsed double D)"
    );

    assertEqual(
      normalizeAddress("Phường An Phú"),
      "ANPHU",
      "PHƯỜNG AN PHÚ -> ANPHU"
    );

    // 3. Test similarity matches (fuzzy)
    const sim1 = getSimilarity("12/B2 D2 KP3", "12/B2 DUONG D2 KP3");
    console.log(`Similarity ("12/B2 D2 KP3", "12/B2 DUONG D2 KP3") = ${(sim1 * 100).toFixed(2)}%`);
    assertEqual(isMatchingAddress("12/B2 D2 KP3", "12/B2 DUONG D2 KP3"), true, "Similarity >= 95%");

    const sim2 = getSimilarity("12/B2 KP3", "12/B2 KHU PHO 3");
    console.log(`Similarity ("12/B2 KP3", "12/B2 KHU PHO 3") = ${(sim2 * 100).toFixed(2)}%`);
    assertEqual(isMatchingAddress("12/B2 KP3", "12/B2 KHU PHO 3"), true, "Similarity >= 95%");

    // 4. Test short-form (house number only) matching
    assertEqual(
      isMatchingAddress(
        "57/B1, Đường D1, TỔ 1, Khu phố 3, Phường An Phú, Thành phố Hồ Chí Minh",
        "57/B1"
      ),
      true,
      "57/B1 full matches short-form 57/B1"
    );

    assertEqual(
      isMatchingAddress("57/B1 D1", "57/B1 D2"),
      false,
      "57/B1 D1 does NOT match 57/B1 D2 (different streets)"
    );

    console.log("\n=== ALL UNIT TESTS PASSED SUCCESSFULLY! ===");
  } catch (err: any) {
    console.error("\n!!! UNIT TEST FAILED !!!");
    console.error(err.message || err);
    process.exit(1);
  }
}

runTests();
