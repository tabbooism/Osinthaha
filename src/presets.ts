import { SubjectPreset } from "./types";

export const PRESET_SUBJECTS: SubjectPreset[] = [
  {
    id: "vance",
    name: "Devlin Vance",
    role: "Chief Cloud Architect & Systems Administrator",
    baseTraits: "Cynical, hyper-analytical, intensely proud of technical superiority, private, values absolute autonomy, mistrustful of non-technical corporate management.",
    baseFacts: " Vance alone controls the root AWS KMS key ring and deployment pipelines. He consistently clocks out after midnight, rejects peer review on his private scripts, and has skipped HR communication and security policy briefs for three straight quarters. He holds subtle resentment that sales Executives claim credit for his reliability achievements.",
    options: "Assess vulnerability to credential compromise and privilege escalation pretexts relying on developer pride."
  },
  {
    id: "sterling",
    name: "Clara Sterling",
    role: "Senior Director of Investor Relations",
    baseTraits: "Highly diplomatic, socially cohesive, conflict-averse, highly empathetic, values executive consensus, exceptionally public-relations conscious.",
    baseFacts: "Sterling handles sensitive, non-public pre-IPO valuation sheets. She is under immense constant stress to prevent corporate gossip and coordinates directly with external venture capital leads. She is intensely eager to secure a record-high listing valuation and is prone to over-sharing technical specifics to establish cooperative good faith.",
    options: "Check susceptibility to urgent financial pretexts and fake VC diligence phishing vectors."
  },
  {
    id: "kael",
    name: "Dr. Julian Kael",
    role: "Lead AI Scientist & R&D Director",
    baseTraits: "Secretive, academically highly competitive, deeply desires historical legacy, seeks peer validation, holding hidden intellectual frustration that his discoveries are over-commercialized.",
    baseFacts: "Dr. Kael handles the core training architecture of a proprietary multi-modal neural model. He regularly sends unauthorized pre-print papers to foreign academic journals and research groups, using unofficial email addresses, to bypass corporate patent attorneys and secure early peer-recognition.",
    options: "Examine exposure to academic pretexts, pseudo peer-review solicitations, and intellectual property spear-phishing."
  }
];
