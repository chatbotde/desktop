export type FactCheckVerdict = 'true' | 'false' | 'mixed' | 'unverified'

export type FactCheckStage = 'transcribing' | 'checking' | 'synthesizing' | 'complete' | 'error'

export interface FactCheckSource {
  id: string
  url: string
  title: string
  snippet: string
  publishedDate?: string
  favicon?: string
  image?: string
  domain: string
}

export interface FactCheckResult {
  claim: string
  verdict: FactCheckVerdict
  summary: string
  sources: FactCheckSource[]
  stage?: FactCheckStage
  error?: string
}

export interface FactCheckProgress {
  stage: FactCheckStage
  claim?: string
}
