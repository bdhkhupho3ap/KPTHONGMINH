import "dotenv/config";
import { supabase } from "../supabaseClient";
import { initialHouseholds, initialResidents, initialBusinesses, initialReports } from "../mockData";
import { Household, Resident, Business, FieldReport } from "../types";

// Helper normalization function
const normalizeAddress = (addr: string): string => {
  return (addr || "")
    .toLowerCase()
    .replace(/[,\-\./]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const mapIdToUuid = (id: string): string => {
  if (!id || id.includes("-")) return id;
  
  let prefix = "";
  let numStr = "";
  
  if (id.startsWith("REP")) {
    prefix = "1";
    numStr = id.substring(3);
  } else if (id.startsWith("H")) {
    prefix = "2";
    numStr = id.substring(1);
  } else if (id.startsWith("B")) {
    prefix = "3";
    numStr = id.substring(1);
  } else if (id.startsWith("R")) {
    prefix = "4";
    numStr = id.substring(1);
  }
  
  if (prefix && numStr) {
    const num = parseInt(numStr, 10) || 0;
    return `00000000-0000-0000-0000-${prefix}${num.toString().padStart(11, '0')}`;
  }
  
  return id;
};

const mapHouseholdToDb = (hh: Household): any => ({
  id: mapIdToUuid(hh.id),
  household_code: hh.code,
  normalized_address: hh.normalizedAddress || normalizeAddress(hh.address),
  display_address: hh.address,
  gps: hh.coordinates || null,
  head_person_id: hh.headPersonId || null,
  member_count: hh.members?.length || hh.memberCount || 0,
  status: hh.type || 'Thường trú',
  deleted_at: hh.deletedAt || null,
  deleted_by: hh.deletedBy || null
});

const mapResidentToDb = (res: Resident, allHouseholds: Household[]): any => {
  const hh = allHouseholds.find(h => h.code === res.householdId);
  const rawId = hh ? hh.id : (res.householdUuid || null);
  const noteData = {
    relationToOwner: res.relationToOwner || 'Thành viên',
    permanentAddress: res.permanentAddress || '',
    healthInsuranceCard: res.healthInsuranceCard || '',
    gtDen: res.gtDen || ''
  };
  return {
    id: res.id,
    name: res.fullName,
    dob: res.birthDate,
    gender: res.gender,
    idCard: res.cccd,
    address: res.address,
    status: res.status,
    phone: res.phone,
    occupation: res.occupation,
    note: JSON.stringify(noteData),
    household_id: rawId ? mapIdToUuid(rawId) : null,
    normalized_address: res.normalizedAddress || normalizeAddress(res.address)
  };
};

const mapBusinessToDb = (b: Business): any => ({
  id: mapIdToUuid(b.id),
  name: b.name,
  status: b.status,
  employee_count: b.employeeCount,
  safety_certified: b.safetyCertified,
  tax_code: b.licenseNumber || null
});

const mapReportToDb = (r: FieldReport): any => ({
  id: mapIdToUuid(r.id),
  title: r.title,
  reporter_name: r.reporterName,
  reporter_phone: r.reporterPhone,
  description: r.description,
  status_id: r.status,
  latitude: r.coordinates?.x || null,
  longitude: r.coordinates?.y || null,
  before_image_url: r.beforeImage || null,
  after_image_url: r.afterImage || null
});

async function runSeed() {
  console.log("=== STARTING SEED TO SUPABASE ===");
  try {
    // 1. Seed Households
    console.log("Seeding Households...");
    const dbHh = initialHouseholds.map(mapHouseholdToDb);
    const { error: hhErr } = await supabase.from('Household').upsert(dbHh);
    if (hhErr) throw new Error(`Household Seeding Error: ${hhErr.message}`);
    console.log("Households seeded successfully.");

    // 2. Seed Persons
    console.log("Seeding Persons (Residents)...");
    const dbRes = initialResidents.map(r => mapResidentToDb(r, initialHouseholds));
    const { error: resErr } = await supabase.from('Person').upsert(dbRes);
    if (resErr) throw new Error(`Person Seeding Error: ${resErr.message}`);
    console.log("Persons seeded successfully.");

    // 3. Seed Businesses
    console.log("Seeding Businesses...");
    const dbBus = initialBusinesses.map(mapBusinessToDb);
    const { error: busErr } = await supabase.from('businesses').upsert(dbBus);
    if (busErr) {
      console.warn(`Businesses table insert failed (check table/schema name): ${busErr.message}`);
    } else {
      console.log("Businesses seeded successfully.");
    }

    // 4. Seed Incidents (Reports)
    console.log("Seeding Incidents (Reports)...");
    const dbRep = initialReports.map(mapReportToDb);
    const { error: repErr } = await supabase.from('incidents').upsert(dbRep);
    if (repErr) {
      console.warn(`Incidents table insert failed (check table/schema name): ${repErr.message}`);
    } else {
      console.log("Incidents seeded successfully.");
    }

    console.log("=== DATABASE SEEDING COMPLETED SUCCESSFULLY ===");
  } catch (err: any) {
    console.error("=== SEEDING FAILED ===");
    console.error(err.message || err);
  }
}

runSeed();
