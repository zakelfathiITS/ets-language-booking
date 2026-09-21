/**
 * @jest-environment node
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Guards the architecture rules themselves: files breaking a boundary are
 * written into the real layer folders, linted, and must be rejected. Without
 * this test a configuration mistake could silently disable every rule.
 */
const ROOT = join(__dirname, "..", "..");

const violations: Record<string, string> = {
  "src/components/atoms/ArchitectureProbeFeature.tsx": `import { useAuth } from "@/features/auth/useAuth";\nexport const probe = useAuth;\n`,
  "src/components/atoms/ArchitectureProbeRedux.tsx": `import { useSelector } from "react-redux";\nexport const probe = useSelector;\n`,
  "src/components/molecules/ArchitectureProbeUpward.tsx": `import { Navbar } from "../organisms/Navbar";\nexport const probe = Navbar;\n`,
  "src/components/organisms/ArchitectureProbeStore.tsx": `import { useAppSelector } from "@/store/hooks";\nexport const probe = useAppSelector;\n`,
  "src/features/architecture-probe/axios.ts": `import axios from "axios";\nexport const probe = axios;\n`,
  "src/app/architecture-probe.ts": `import { axiosClient } from "@/services/http/axiosClient";\nexport const probe = axiosClient;\n`,
};

const compliant = {
  "src/components/templates/ArchitectureProbeValid.tsx": `import { Navbar } from "../organisms/Navbar";\nexport const probe = Navbar;\n`,
};

interface LintResult {
  filePath: string;
  messages: Array<{ ruleId: string | null }>;
}

function lint(files: string[]): LintResult[] {
  const result = spawnSync("node", ["node_modules/eslint/bin/eslint.js", "--format", "json", ...files], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });

  return JSON.parse(result.stdout) as LintResult[];
}

describe("architecture boundaries", () => {
  const files = { ...violations, ...compliant };
  let results: LintResult[] = [];

  beforeAll(() => {
    for (const [file, source] of Object.entries(files)) {
      mkdirSync(dirname(join(ROOT, file)), { recursive: true });
      writeFileSync(join(ROOT, file), source);
    }

    try {
      results = lint(Object.keys(files));
    } finally {
      for (const file of Object.keys(files)) {
        rmSync(join(ROOT, file));
      }
      rmSync(join(ROOT, "src/features/architecture-probe"), { recursive: true, force: true });
    }
  }, 120_000);

  function boundaryErrorsIn(file: string): number {
    const result = results.find((entry) => entry.filePath.endsWith(file));

    return result?.messages.filter((message) => message.ruleId === "boundaries/dependencies").length ?? -1;
  }

  it.each(Object.keys(violations))("rejects %s", (file) => {
    expect(boundaryErrorsIn(file)).toBeGreaterThan(0);
  });

  it("accepts a dependency that follows the rules", () => {
    expect(boundaryErrorsIn(Object.keys(compliant)[0])).toBe(0);
  });
});
