// PCI-DSS specific types

export interface TestingProcedure {
  id: string; // "1.2.3.a", "1.2.3.b"
  description: string;
  expectedEvidence?: string[];
  assessorNotes?: string;
}

export interface ControlMapping {
  framework: "NIST-800-53" | "ISO-27001" | "FedRAMP" | "CIS" | "SOC2";
  controlId: string;
  controlFamily?: string;
  mappingType: "primary" | "partial" | "supporting";
  notes?: string;
}

// Control mapping data structures
export interface FrameworkControl {
  controlId: string;
  controlName: string;
  controlFamily: string;
  mappingType: "primary" | "partial" | "supporting";
}

export interface PciDssControlMapping {
  pciDssRequirement: string;
  framework: string;
  controls: FrameworkControl[];
}

export interface ControlMappingsData {
  version: string;
  lastUpdated: string;
  description: string;
  frameworks: Record<string, { version: string; url: string }>;
  mappings: PciDssControlMapping[];
}

export interface Reference {
  type: "appendix" | "glossary" | "external" | "pci_document";
  id: string;
  title?: string;
  url?: string;
}

export interface PciDssRequirement {
  // Requirement identification
  id: string; // "1", "1.1", "1.1.1", "1.2.3"
  number: string; // Display number "1.2.3"
  level: number; // Hierarchy depth (1, 2, 3)
  parentId?: string; // "1.2" for "1.2.3"

  // Core content
  title: string;
  statement: string;

  // Defined Approach (standard method)
  definedApproach?: {
    requirement: string;
    testingProcedures: TestingProcedure[];
  };

  // Customized Approach (alternative method, new in v4.0)
  customizedApproach?: {
    objective: string;
    exampleImplementations?: string[];
  };

  // Metadata
  applicability?: string[]; // ["Service Providers", "Merchants"]
  effectiveDate?: string;
  isNewInV4?: boolean;
  changedFromV3?: boolean;

  // Relationships
  relatedRequirements?: string[];
  controlMappings?: ControlMapping[];

  // References
  references?: Reference[];
  guidanceText?: string;
}

export interface Appendix {
  id: string;
  title: string;
  content: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  references?: string[];
}

export interface PciDssDocument {
  info: {
    version: string; // "4.0.1"
    published: string; // "2024-03-31"
    effectiveDate: string;
    documentType: "standard" | "summary_of_changes";
    convertedAt: string;
    convertedBy: string; // "docling v1.16.1"
  };

  requirements: PciDssRequirement[];

  // Cross-references
  appendices: Appendix[];
  glossary: GlossaryTerm[];
}

// Markdown document types (adapted from FedRAMP)
export interface MarkdownDoc {
  path: string;
  content: string;
  sha256: string;
  headings: Array<{ depth: number; title: string; line: number }>;
  lines: string[];
}

export interface MarkdownSearchHit {
  path: string;
  line: number;
  snippet: string;
  score: number;
}

export interface MarkdownSearchResult {
  total: number;
  hits: MarkdownSearchHit[];
}

// Index state
export interface IndexState {
  repoPath: string;
  indexedAt: number;
  documentVersion: string;

  // Core data
  pciDssDocument: PciDssDocument;
  requirements: Map<string, PciDssRequirement>;
  controlMappings: ControlMapping[];
  controlMappingsData?: ControlMappingsData;

  // Search indices
  markdownDocs: Map<string, MarkdownDoc>;

  errors: string[];
}

// Error handling types (from FedRAMP pattern)
export interface ErrorDetail {
  code:
    | "NOT_FOUND"
    | "BAD_REQUEST"
    | "INDEX_NOT_READY"
    | "REPO_CLONE_FAILED"
    | "IO_ERROR"
    | "PARSE_ERROR"
    | "UNSUPPORTED";
  message: string;
  hint?: string;
}

export interface ToolExecutionError extends Error {
  detail: ErrorDetail;
}

// Health check
export interface HealthCheckResult {
  ok: boolean;
  documentVersion: string;
  indexedRequirements: number;
  repoPath: string;
  errors?: string[];
}

// Evidence examples (community-sourced, not official PCI-DSS)
export interface EvidenceSource {
  provider: string;
  command?: string;
  api?: string;
  artifact?: string;
  description?: string;
  field?: string;
  service?: string;
}

export interface EvidenceItem {
  type:
    | "api"
    | "report"
    | "scan"
    | "log"
    | "configuration"
    | "documentation"
    | "inventory"
    | "metrics";
  description: string;
  tip?: string;
  sources: EvidenceSource[];
}

export interface RequirementEvidenceExample {
  requirementId: string;
  requirementTitle: string;
  evidence: EvidenceItem[];
}

export interface EvidenceExamplesData {
  $schema?: string;
  disclaimer: string;
  version: string;
  lastUpdated: string;
  examples: Record<string, RequirementEvidenceExample>;
}

// Version comparison types
export type VersionChange =
  | { type: "new"; v4Id: string; title?: string }
  | { type: "modified"; v3Id?: string; v4Id: string; title?: string; description: string }
  | { type: "removed"; v3Id: string; title?: string }
  | { type: "renumbered"; v3Id: string; v4Id: string; title?: string };

export interface VersionComparison {
  summary: {
    new: number;
    modified: number;
    removed: number;
    renumbered: number;
  };
  changes: VersionChange[];
}
