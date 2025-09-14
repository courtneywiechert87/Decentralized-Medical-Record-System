import { describe, it, expect, beforeEach } from "vitest";
import { bufferCV, stringUtf8CV, uintCV, noneCV, someCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_RECORD_HASH = 101;
const ERR_INVALID_TITLE = 102;
const ERR_INVALID_TIMESTAMP = 103;
const ERR_RECORD_ALREADY_EXISTS = 104;
const ERR_RECORD_NOT_FOUND = 105;
const ERR_INVALID_METADATA = 106;
const ERR_INVALID_CATEGORY = 107;
const ERR_INVALID_SIZE = 108;
const ERR_INVALID_STATUS = 109;
const ERR_MAX_RECORDS_EXCEEDED = 110;
const ERR_INVALID_ENCRYPTION_KEY = 111;
const ERR_INVALID_AUTHORITY = 112;
const ERR_INVALID_VERSION = 113;

interface Record {
  owner: string;
  recordHash: Buffer;
  title: string;
  timestamp: number;
  category: string;
  size: number;
  status: boolean;
  encryptionKey: Buffer;
  version: number;
}

interface Metadata {
  description: string;
  lastUpdated: number;
  accessCount: number;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class RecordStorageMock {
  state: {
    nextRecordId: number;
    maxRecords: number;
    authorityContract: string | null;
    records: Map<number, Record>;
    recordsByHash: Map<string, { recordId: number }>;
    recordMetadata: Map<number, Metadata>;
  } = {
    nextRecordId: 0,
    maxRecords: 10000,
    authorityContract: null,
    records: new Map(),
    recordsByHash: new Map(),
    recordMetadata: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  authorities: Set<string> = new Set(["ST1TEST"]);

  reset() {
    this.state = {
      nextRecordId: 0,
      maxRecords: 10000,
      authorityContract: null,
      records: new Map(),
      recordsByHash: new Map(),
      recordMetadata: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.authorities = new Set(["ST1TEST"]);
  }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (contractPrincipal === "SP000000000000000000002Q6VF78") return { ok: false, value: ERR_INVALID_AUTHORITY };
    if (this.state.authorityContract !== null) return { ok: false, value: ERR_INVALID_AUTHORITY };
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  storeRecord(
    recordHash: Buffer,
    title: string,
    timestamp: number,
    category: string,
    size: number,
    status: boolean,
    encryptionKey: Buffer,
    version: number,
    description: string
  ): Result<number> {
    if (this.state.nextRecordId >= this.state.maxRecords) return { ok: false, value: ERR_MAX_RECORDS_EXCEEDED };
    if (recordHash.length !== 32) return { ok: false, value: ERR_INVALID_RECORD_HASH };
    if (!title || title.length > 100) return { ok: false, value: ERR_INVALID_TITLE };
    if (timestamp < this.blockHeight) return { ok: false, value: ERR_INVALID_TIMESTAMP };
    if (!["lab-results", "prescriptions", "diagnoses", "imaging"].includes(category)) return { ok: false, value: ERR_INVALID_CATEGORY };
    if (size > 1048576) return { ok: false, value: ERR_INVALID_SIZE };
    if (encryptionKey.length !== 32) return { ok: false, value: ERR_INVALID_ENCRYPTION_KEY };
    if (version > 100) return { ok: false, value: ERR_INVALID_VERSION };
    if (description.length > 500) return { ok: false, value: ERR_INVALID_METADATA };
    if (this.state.recordsByHash.has(recordHash.toString("hex"))) return { ok: false, value: ERR_RECORD_ALREADY_EXISTS };

    const recordId = this.state.nextRecordId;
    const record: Record = { owner: this.caller, recordHash, title, timestamp, category, size, status, encryptionKey, version };
    this.state.records.set(recordId, record);
    this.state.recordsByHash.set(recordHash.toString("hex"), { recordId });
    this.state.recordMetadata.set(recordId, { description, lastUpdated: this.blockHeight, accessCount: 0 });
    this.state.nextRecordId++;
    return { ok: true, value: recordId };
  }

  getRecord(recordId: number): Record | null {
    return this.state.records.get(recordId) || null;
  }

  getRecordByHash(recordHash: Buffer): Record | null {
    const entry = this.state.recordsByHash.get(recordHash.toString("hex"));
    if (!entry) return null;
    return this.state.records.get(entry.recordId) || null;
  }

  getRecordMetadata(recordId: number): Metadata | null {
    return this.state.recordMetadata.get(recordId) || null;
  }

  isRecordRegistered(recordHash: Buffer): Result<boolean> {
    return { ok: true, value: this.state.recordsByHash.has(recordHash.toString("hex")) };
  }

  getRecordCount(): Result<number> {
    return { ok: true, value: this.state.nextRecordId };
  }

  updateRecordMetadata(recordId: number, newTitle: string, newDescription: string, newCategory: string, newStatus: boolean): Result<boolean> {
    const record = this.state.records.get(recordId);
    const metadata = this.state.recordMetadata.get(recordId);
    if (!record || !metadata) return { ok: false, value: ERR_RECORD_NOT_FOUND };
    if (record.owner !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (!newTitle || newTitle.length > 100) return { ok: false, value: ERR_INVALID_TITLE };
    if (!["lab-results", "prescriptions", "diagnoses", "imaging"].includes(newCategory)) return { ok: false, value: ERR_INVALID_CATEGORY };
    if (newDescription.length > 500) return { ok: false, value: ERR_INVALID_METADATA };
    
    const updatedRecord: Record = { ...record, title: newTitle, category: newCategory, status: newStatus };
    this.state.records.set(recordId, updatedRecord);
    this.state.recordMetadata.set(recordId, { description: newDescription, lastUpdated: this.blockHeight, accessCount: metadata.accessCount });
    return { ok: true, value: true };
  }

  incrementAccessCount(recordId: number): Result<boolean> {
    const record = this.state.records.get(recordId);
    const metadata = this.state.recordMetadata.get(recordId);
    if (!record || !metadata) return { ok: false, value: ERR_RECORD_NOT_FOUND };
    this.state.recordMetadata.set(recordId, { ...metadata, accessCount: metadata.accessCount + 1 });
    return { ok: true, value: true };
  }
}

describe("RecordStorage", () => {
  let contract: RecordStorageMock;
  const sampleHash = Buffer.alloc(32, 1);
  const sampleKey = Buffer.alloc(32, 2);

  beforeEach(() => {
    contract = new RecordStorageMock();
    contract.reset();
  });

  it("stores a record successfully", () => {
    const result = contract.storeRecord(sampleHash, "Blood Test", 100, "lab-results", 1024, true, sampleKey, 1, "Test results");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const record = contract.getRecord(0);
    expect(record?.title).toBe("Blood Test");
    expect(record?.category).toBe("lab-results");
    expect(record?.size).toBe(1024);
    expect(record?.status).toBe(true);
    expect(record?.version).toBe(1);
    const metadata = contract.getRecordMetadata(0);
    expect(metadata?.description).toBe("Test results");
    expect(metadata?.accessCount).toBe(0);
  });

  it("rejects duplicate record hash", () => {
    contract.storeRecord(sampleHash, "Blood Test", 100, "lab-results", 1024, true, sampleKey, 1, "Test results");
    const result = contract.storeRecord(sampleHash, "Duplicate Test", 100, "lab-results", 1024, true, sampleKey, 1, "Duplicate");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_RECORD_ALREADY_EXISTS);
  });

  it("rejects invalid record hash", () => {
    const invalidHash = Buffer.alloc(31);
    const result = contract.storeRecord(invalidHash, "Blood Test", 100, "lab-results", 1024, true, sampleKey, 1, "Test results");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_RECORD_HASH);
  });

  it("rejects invalid title", () => {
    const result = contract.storeRecord(sampleHash, "", 100, "lab-results", 1024, true, sampleKey, 1, "Test results");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_TITLE);
  });

  it("rejects invalid category", () => {
    const result = contract.storeRecord(sampleHash, "Blood Test", 100, "invalid", 1024, true, sampleKey, 1, "Test results");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_CATEGORY);
  });

  it("rejects invalid encryption key", () => {
    const invalidKey = Buffer.alloc(31);
    const result = contract.storeRecord(sampleHash, "Blood Test", 100, "lab-results", 1024, true, invalidKey, 1, "Test results");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_ENCRYPTION_KEY);
  });

  it("updates record metadata successfully", () => {
    contract.storeRecord(sampleHash, "Blood Test", 100, "lab-results", 1024, true, sampleKey, 1, "Test results");
    const result = contract.updateRecordMetadata(0, "Updated Test", "New description", "prescriptions", false);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const record = contract.getRecord(0);
    expect(record?.title).toBe("Updated Test");
    expect(record?.category).toBe("prescriptions");
    expect(record?.status).toBe(false);
    const metadata = contract.getRecordMetadata(0);
    expect(metadata?.description).toBe("New description");
  });

  it("rejects metadata update by non-owner", () => {
    contract.storeRecord(sampleHash, "Blood Test", 100, "lab-results", 1024, true, sampleKey, 1, "Test results");
    contract.caller = "ST2FAKE";
    const result = contract.updateRecordMetadata(0, "Updated Test", "New description", "prescriptions", false);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("increments access count successfully", () => {
    contract.storeRecord(sampleHash, "Blood Test", 100, "lab-results", 1024, true, sampleKey, 1, "Test results");
    const result = contract.incrementAccessCount(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const metadata = contract.getRecordMetadata(0);
    expect(metadata?.accessCount).toBe(1);
  });

  it("rejects access count increment for non-existent record", () => {
    const result = contract.incrementAccessCount(99);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_RECORD_NOT_FOUND);
  });

  it("gets record by hash", () => {
    contract.storeRecord(sampleHash, "Blood Test", 100, "lab-results", 1024, true, sampleKey, 1, "Test results");
    const record = contract.getRecordByHash(sampleHash);
    expect(record?.title).toBe("Blood Test");
  });

  it("rejects record creation with max records exceeded", () => {
    contract.state.maxRecords = 1;
    contract.storeRecord(sampleHash, "Blood Test", 100, "lab-results", 1024, true, sampleKey, 1, "Test results");
    const result = contract.storeRecord(Buffer.alloc(32, 2), "Another Test", 100, "lab-results", 1024, true, sampleKey, 1, "More results");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_RECORDS_EXCEEDED);
  });

  it("sets authority contract successfully", () => {
    const result = contract.setAuthorityContract("ST2TEST");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.authorityContract).toBe("ST2TEST");
  });
});