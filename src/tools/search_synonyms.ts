/**
 * PCI-DSS v3.2.1 to v4.0.1 terminology synonym mappings
 *
 * Purpose: Enable search queries using legacy v3.2.1 terminology to find
 * corresponding v4.0.1 requirements which use updated terminology.
 *
 * Example: Searching for "firewall" will automatically expand to include
 * "network security controls" (the v4.0.1 equivalent term).
 */

export const PCI_DSS_SYNONYMS: Record<string, string[]> = {
  // Network Security Terminology (Requirement 1)
  // v3.2.1: "firewall" → v4.0.1: "network security controls (NSCs)"
  firewall: ["network security controls", "NSC", "NSCs", "network security"],
  firewalls: ["network security controls", "NSCs"],

  // Authentication Terminology (Requirement 8)
  // v3.2.1: "two-factor authentication" → v4.0.1: "multi-factor authentication (MFA)"
  "two-factor": ["multi-factor authentication", "MFA", "multi factor"],
  "2fa": ["multi-factor authentication", "MFA", "multi factor"],
  "two factor": ["multi-factor authentication", "MFA"],

  // System/Software Terminology (Requirement 6)
  // v3.2.1: "application" → v4.0.1: "software/system" (more inclusive)
  application: ["software", "system"],
  applications: ["software", "systems"],

  // Wireless Terminology (Requirement 1/2)
  wireless: ["wireless networks", "WiFi", "WLAN"],

  // Assessment Terminology
  qsa: ["Qualified Security Assessor", "assessor", "qualified assessor"],
  asv: ["Approved Scanning Vendor", "scanning vendor", "approved vendor"],

  // Access Control Terminology
  administrator: ["admin", "privileged user", "administrative user"],
  administrators: ["admins", "privileged users", "administrative users"],

  // Encryption Terminology (Requirement 3)
  encryption: ["cryptographic", "crypto", "cryptography"],
  encrypted: ["cryptographic", "crypto"],

  // Password Terminology (Requirement 8)
  password: [
    "authentication credential",
    "passphrase",
    "credential",
    "authentication",
  ],
  passwords: [
    "authentication credentials",
    "passphrases",
    "credentials",
  ],
};

/**
 * Get all synonyms for a given term (case-insensitive)
 * @param term The search term
 * @returns Array of synonyms, or empty array if none found
 */
export function getSynonyms(term: string): string[] {
  const lowerTerm = term.toLowerCase().trim();
  return PCI_DSS_SYNONYMS[lowerTerm] || [];
}

/**
 * Check if a term has synonyms defined
 * @param term The search term
 * @returns True if synonyms exist for this term
 */
export function hasSynonyms(term: string): boolean {
  const lowerTerm = term.toLowerCase().trim();
  return lowerTerm in PCI_DSS_SYNONYMS;
}
