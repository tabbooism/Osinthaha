export interface SubjectPreset {
  id: string;
  name: string;
  role: string;
  baseTraits: string;
  baseFacts: string;
  options: string;
}

export interface LawOfPower {
  lawNumber: number;
  lawTitle: string;
  relevance: string;
}

export interface ClinicalDossier {
  summary: string;
  cognitiveProfile: string;
  psychDefenseMechanisms: string[];
  coreMotivators: string[];
  stressors: string[];
  interpersonalStyle: string;
}

export interface GreeneAnalysis {
  dominantRobertGreeneLaws: LawOfPower[];
  powerVulnerabilities: string[];
  leverageTactics: string[];
}

export interface SusceptibilityMeter {
  vectorName: string;
  score: number;
  explanation: string;
}

export interface SocialEngineeringVector {
  scenarioName: string;
  psychologicalTriggers: string[];
  simulationReaction: string;
  defensiveMitigation: string;
}

export interface RedOpsAssessment {
  susceptibilityMeters: SusceptibilityMeter[];
  socialEngineeringVectors: SocialEngineeringVector[];
}

export interface SimulationOption {
  label: string;
  resultDescription: string;
  success: boolean;
}

export interface InteractiveSimulation {
  scenarioTitle: string;
  settingDescription: string;
  npcDialogue: string;
  options: SimulationOption[];
}

export interface DossierReport {
  clinicalDossier: ClinicalDossier;
  greeneAnalysis: GreeneAnalysis;
  redOpsAssessment: RedOpsAssessment;
  interactiveSimulation: InteractiveSimulation;
}
