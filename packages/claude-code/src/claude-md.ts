import type { Bundle } from '@specflow/core';
import { generateClaudeMdContent } from '@specflow/core';

export function generateClaudeMd(bundle: Bundle, projectName: string): string {
  return generateClaudeMdContent(
    bundle.data,
    projectName,
    bundle.version,
    bundle.createdAt,
    bundle.metadata.totalFacts,
  );
}
