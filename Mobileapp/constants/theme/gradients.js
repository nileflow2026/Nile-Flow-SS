/**
 * Nile Flow Design System — Gradient Tokens
 *
 * Pre-defined gradient arrays for expo-linear-gradient.
 * Usage:
 *   import { gradients } from "@/constants/theme";
 *   <LinearGradient colors={gradients.green} ... />
 */

import { green, gold } from "./colors";

/** Top → bottom green gradient (brand / CTA) */
export const greenGradient = [green[600], green[500], green[400]];

/** Top-left → bottom-right gold-to-bronze gradient (accent / hero) */
export const goldBronzeGradient = [gold[400], gold[500], gold[700]];

/** Soft green tint for cards / tags */
export const greenSoftGradient = [green[50], green[100]];

/** Soft gold tint for badges / highlights */
export const goldSoftGradient = [gold[50], gold[100]];

/** Button: green gradient direction defaults */
export const greenButtonStart = { x: 0, y: 0 };
export const greenButtonEnd = { x: 1, y: 0 };

/** Hero logo: gold-to-bronze diagonal */
export const goldHeroStart = { x: 0, y: 0 };
export const goldHeroEnd = { x: 1, y: 1 };

const gradients = {
  green: greenGradient,
  goldBronze: goldBronzeGradient,
  greenSoft: greenSoftGradient,
  goldSoft: goldSoftGradient,
};

export default gradients;
