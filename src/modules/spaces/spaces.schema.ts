import { z } from "zod";

export const spaceCodeSchema = z.object({
  code: z.string().min(1),
});

export type SpaceCodeInput = z.infer<typeof spaceCodeSchema>;
