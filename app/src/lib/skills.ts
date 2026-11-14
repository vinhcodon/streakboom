// The skill files, loaded (ADR-0103). Each file in src/lib/skills/ is one skill; the Rust side reads the same files for the text
// it gives the model (src-tauri/src/brain.rs), so a skill has one place to be written.
import leaveJson from "./skills/leave.skill.json" with { type: "json" };
import type { SkillDef } from "./skill-run.ts";

export const LEAVE_SKILL = leaveJson as unknown as SkillDef;
/** Every skill file the program knows. A test checks each is well formed and that the Rust side lists the same names. */
export const SKILL_FILES: readonly SkillDef[] = [LEAVE_SKILL];
