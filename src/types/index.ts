export type FrameworkKind = 
  | 'flutter' 
  | 'react-native' 
  | 'unity' 
  | 'native-kotlin-java' 
  | 'xamarin' 
  | 'cordova-capacitor'
  | 'unknown';

export interface NativeLibInfo {
  name: string;
  architecture: string;
  path: string;
  isCustomCryptoOrSecurity?: boolean;
}

export interface FrameworkInfo {
  kind: FrameworkKind;
  displayName: string;
  confidence: 'observed' | 'derived' | 'inferred';
  details: string;
  hints: string[];
}

export interface AppMetadata {
  name: string;
  packageName: string;
  versionName: string;
  versionCode: string;
  minSdkVersion: string;
  targetSdkVersion: string;
  mainActivity: string;
  activities: string[];
  services: string[];
  receivers: string[];
  permissions: string[];
  nativeLibraries: NativeLibInfo[];
  framework: FrameworkInfo;
  fileSize: number;
  sha256: string;
  totalClasses?: number;
  totalStrings?: number;
}

export interface SecurityDossier {
  rootDetection: {
    found: boolean;
    confidence: 'observed' | 'inferred' | 'none';
    indicators: string[];
    bypassTip: string;
  };
  sslPinning: {
    found: boolean;
    confidence: 'observed' | 'inferred' | 'none';
    indicators: string[];
    bypassTip: string;
  };
  cryptoPrimitives: {
    algorithm: string;
    description: string;
    locations: string[];
  }[];
  hardcodedSecrets: {
    type: 'api_key' | 'firebase_url' | 'jwt_token' | 'private_key' | 'generic_secret';
    key: string;
    maskedValue: string;
    location: string;
  }[];
  exportedComponents: {
    name: string;
    type: 'activity' | 'service' | 'receiver' | 'provider';
    riskLevel: 'high' | 'medium' | 'low';
    details: string;
  }[];
}

export interface DiscoveredEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'UNKNOWN';
  url: string;
  path: string;
  domain: string;
  headers: Record<string, string>;
  samplePayload?: Record<string, any> | string;
  sampleResponse?: Record<string, any> | string;
  authType: 'bearer' | 'basic' | 'custom-header' | 'cookie' | 'none';
  requiresSignature: boolean;
  signatureAlgorithm?: string;
  sourceContext: string;
  category: 'auth' | 'user' | 'payment' | 'core' | 'sync' | 'analytics' | 'misc';
}

export interface FlowNode {
  id: string;
  type: 'appLaunch' | 'securityGate' | 'authStep' | 'cryptoStep' | 'apiEndpoint' | 'dataLayer' | 'uiView';
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: string;
  icon: string;
  data: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface ReconstructionStep {
  step: number;
  phase: string;
  title: string;
  explanation: string;
  howToBuild: string;
  gotchas?: string[];
  codeSample?: string;
}

export interface ReconstructionRecipe {
  overview: string;
  architectureSummary: string;
  howItWorksInPlainEnglish: string;
  stepByStepGuide: ReconstructionStep[];
  codeSnippets: {
    typescript: string;
    python: string;
    curl: string;
  };
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  app: AppMetadata;
  security: SecurityDossier;
  endpoints: DiscoveredEndpoint[];
  flow: {
    nodes: FlowNode[];
    edges: FlowEdge[];
  };
  recipe: ReconstructionRecipe;
}
