import { and, desc, eq } from "drizzle-orm";
import {
  db,
  programsTable,
  levelsTable,
  tasksTable,
  type Program,
  type Level,
  type Task,
} from "@workspace/db";

export interface LoadedProgram {
  program: Program;
  levels: Level[];
  tasks: Task[];
  tasksByLevel: Map<number, Task[]>;
}

export async function loadProgram(
  programId: number,
): Promise<LoadedProgram | null> {
  const [program] = await db
    .select()
    .from(programsTable)
    .where(eq(programsTable.id, programId));
  if (!program) return null;

  const levels = await db
    .select()
    .from(levelsTable)
    .where(eq(levelsTable.programId, programId));
  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.programId, programId));

  const tasksByLevel = new Map<number, Task[]>();
  for (const t of tasks) {
    const arr = tasksByLevel.get(t.levelId) ?? [];
    arr.push(t);
    tasksByLevel.set(t.levelId, arr);
  }

  return { program, levels, tasks, tasksByLevel };
}

export async function getActiveProgram(
  userId: number,
): Promise<LoadedProgram | null> {
  const [program] = await db
    .select()
    .from(programsTable)
    .where(and(eq(programsTable.userId, userId), eq(programsTable.status, "active")))
    .orderBy(desc(programsTable.createdAt));
  if (!program) return null;
  return loadProgram(program.id);
}
