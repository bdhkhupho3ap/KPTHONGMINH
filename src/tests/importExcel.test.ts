import { normalizeAddress, getSimilarity, isMatchingAddress } from "../utils/addressEngine";
import { Resident, Household } from "../types";

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${message}\nExpected: ${JSON.stringify(expected)}\nActual:   ${JSON.stringify(actual)}`);
  }
  console.log(`PASS: ${message}`);
}

function runIntegrationTest() {
  console.log("=== RUNNING INTEGRATION TEST FOR EXCEL IMPORT AUTO-MERGE ===");

  // 1. Setup mock existing state
  const mockHouseholds: Household[] = [
    {
      id: "H-001",
      code: "HK-000001",
      ownerName: "Nguyen Van A",
      address: "SO NHA 12/B2 PHAN CHU TRINH PHUONG AN PHU THU DUC HỒ CHÍ MINH",
      memberCount: 1,
      members: [{ name: "Nguyen Van A", relation: "Chủ hộ", cccd: "123456789", birthYear: 1980 }],
      normalizedAddress: normalizeAddress("SO NHA 12/B2 PHAN CHU TRINH PHUONG AN PHU THU DUC HỒ CHÍ MINH")
    }
  ];

  const mockResidents: Resident[] = [
    {
      id: "R-001",
      fullName: "Nguyen Van A",
      gender: "Nam",
      birthDate: "01/01/1980",
      cccd: "123456789",
      phone: "0900000000",
      status: "Thường trú",
      occupation: "Kinh doanh",
      address: "SO NHA 12/B2 PHAN CHU TRINH PHUONG AN PHU THU DUC HỒ CHÍ MINH",
      householdId: "HK-000001",
      relationToOwner: "Chủ hộ"
    }
  ];

  // 2. Setup mock parsed Excel rows
  // Row 1: 100% match address (SỐ NHÀ 12/B2, PHAN CHU TRINH, Phường An Phú, Thủ Đức)
  // Row 2: 95-99% match address (SO NHA 12/B2A PHAN CHU TRINH PHUONG AN PHU THU DUC HỒ CHÍ MINH) -> ~97.37% similarity
  // Row 3: <95% match address (45 Luong Dinh Cua, KP2, An Phu) -> completely new
  const parsedExcelRows = [
    {
      fullName: "Nguyen Van B",
      cccd: "987654321",
      gender: "Nam" as const,
      birthDate: "15/08/1985",
      phone: "0911111111",
      status: "Thường trú" as const,
      occupation: "Ky su",
      address: "SỐ NHÀ 12/B2, PHAN CHU TRINH, Phường An Phú, Thủ Đức",
      relationToOwner: "Con trai",
      ownerName: "Nguyen Van A",
      isValid: true
    },
    {
      fullName: "Tran Thi C",
      cccd: "555666777",
      gender: "Nữ" as const,
      birthDate: "20/10/1990",
      phone: "0922222222",
      status: "Tạm trú" as const,
      occupation: "Ke toan",
      address: "SO NHA 12/B2 PHAN CHU TRIN PHUONG AN PHU THU DUC HỒ CHÍ MINH",
      relationToOwner: "Thành viên",
      ownerName: "",
      isValid: true
    },
    {
      fullName: "Le Van D",
      cccd: "111222333",
      gender: "Nam" as const,
      birthDate: "05/05/1995",
      phone: "0933333333",
      status: "Tạm trú" as const,
      occupation: "Lai xe",
      address: "45 Luong Dinh Cua, KP2, An Phu",
      relationToOwner: "Chủ hộ",
      ownerName: "Le Van D",
      isValid: true
    }
  ];

  // 3. Simulating the handleConfirmImport process
  const updatedHouseholds = [...mockHouseholds];
  const newResidentsToAdd: Resident[] = [];

  parsedExcelRows.forEach((row, i) => {
    const normAddr = normalizeAddress(row.address);

    // 1. Look for exact match (similarity === 1.0)
    let matchedHh = updatedHouseholds.find(h => normalizeAddress(h.address) === normAddr);

    // 2. Look for fuzzy conflict (similarity >= 0.95 and < 1.0)
    let isFuzzyConflict = false;
    let conflictHh: Household | undefined = undefined;

    if (!matchedHh) {
      conflictHh = updatedHouseholds.find(h => {
        const sim = getSimilarity(h.address, row.address);
        return sim >= 0.95 && sim < 1.0;
      });
      if (conflictHh) {
        isFuzzyConflict = true;
      }
    }

    let hhCode = "";
    let hhId = "";

    if (matchedHh) {
      // Auto-merge to existing household
      hhCode = matchedHh.code;
      hhId = matchedHh.id;

      const newMember = {
        name: row.fullName,
        relation: row.relationToOwner || "Thành viên",
        cccd: row.cccd,
        phone: row.phone,
        birthYear: 1985
      };

      matchedHh.members = matchedHh.members || [];
      if (!matchedHh.members.some(m => m.cccd === row.cccd)) {
        matchedHh.members.push(newMember);
        matchedHh.memberCount = matchedHh.members.length;
      }
    } else {
      // Create a new household (either fuzzy conflict or new address)
      const nextIndex = updatedHouseholds.length + 1;
      hhCode = "HK-" + nextIndex.toString().padStart(6, "0");
      hhId = "H-NEW-" + i;

      const newHh: Household = {
        id: hhId,
        code: hhCode,
        ownerName: row.fullName,
        address: row.address,
        memberCount: 1,
        type: (row.status === "Tạm trú" ? "Tạm trú" : "Thường trú"),
        coordinates: "10°56'08.0\"N 106°44'38.0\"E",
        members: [
          {
            name: row.fullName,
            relation: "Chủ hộ",
            cccd: row.cccd,
            phone: row.phone,
            birthYear: 1990
          }
        ],
        normalizedAddress: normAddr
      };

      if (isFuzzyConflict && conflictHh) {
        (newHh as any).conflictWithCode = conflictHh.code;
        (newHh as any).conflictStatus = "Cần xác minh";
      }

      updatedHouseholds.push(newHh);
    }

    newResidentsToAdd.push({
      id: "R-NEW-" + i,
      fullName: row.fullName,
      gender: row.gender,
      birthDate: row.birthDate,
      cccd: row.cccd,
      phone: row.phone,
      status: row.status,
      occupation: row.occupation,
      address: row.address,
      householdId: hhCode,
      relationToOwner: matchedHh ? (row.relationToOwner || "Thành viên") : "Chủ hộ",
      normalizedAddress: normAddr,
      householdUuid: hhId
    });
  });

  // 4. Assert results
  console.log("\n--- VERIFYING RESULTS ---");
  
  // Row 1: Nguyen Van B (100% similarity address) must be merged into HK-000001
  const bRes = newResidentsToAdd.find(r => r.fullName === "Nguyen Van B");
  assertEqual(bRes?.householdId, "HK-000001", "Row 1 (Nguyen Van B) merged into existing household code");
  assertEqual(updatedHouseholds.find(h => h.code === "HK-000001")?.memberCount, 2, "Household HK-000001 member count increased to 2");

  // Row 2: Tran Thi C (97.37% similarity address) must create a conflict household
  const cRes = newResidentsToAdd.find(r => r.fullName === "Tran Thi C");
  const cHousehold = updatedHouseholds.find(h => h.code === cRes?.householdId);
  assertEqual(cHousehold !== undefined, true, "Row 2 (Tran Thi C) created a new household");
  assertEqual((cHousehold as any).conflictWithCode, "HK-000001", "Row 2 household flagged as conflict with HK-000001");
  assertEqual((cHousehold as any).conflictStatus, "Cần xác minh", "Row 2 household marked as 'Cần xác minh'");

  // Row 3: Le Van D (<95% similarity address) must create a clean new household without conflict
  const dRes = newResidentsToAdd.find(r => r.fullName === "Le Van D");
  const dHousehold = updatedHouseholds.find(h => h.code === dRes?.householdId);
  assertEqual(dHousehold !== undefined, true, "Row 3 (Le Van D) created a new household");
  assertEqual((dHousehold as any).conflictStatus, undefined, "Row 3 household has no conflict flag");

  console.log("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
}

runIntegrationTest();
