import { FileText } from "lucide-react"
import type { FeatureDefinition } from "../types"

export const feature: FeatureDefinition = {
  id: "upload-document",
  label: "Upload Document",
  icon: FileText,
  defaultEnabled: true,
}
