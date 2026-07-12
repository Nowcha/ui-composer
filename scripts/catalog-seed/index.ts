/**
 * Component catalog seed data — single aggregation point.
 * Edit the category files (never src/data/components.json) and run
 * `npm run gen:catalog`.
 *
 * Target: 60 components following prompts/01-catalog-generation.md,
 * classified per component.gallery categories.
 */

import type { CatalogComponent } from "../../src/types/catalog";
import { actionComponents } from "./action";
import { inputBasicComponents } from "./input-basic";
import { inputExtendedComponents } from "./input-extended";
import { displayBasicComponents } from "./display-basic";
import { displayExtendedComponents } from "./display-extended";
import { feedbackComponents } from "./feedback";
import { disclosureComponents } from "./disclosure";
import { navigationComponents } from "./navigation";
import { layoutComponents } from "./layout";
import { mediaComponents } from "./media";
import { reportComponents } from "./report";

export const catalogSeed: CatalogComponent[] = [
  ...actionComponents,
  ...inputBasicComponents,
  ...inputExtendedComponents,
  ...displayBasicComponents,
  ...displayExtendedComponents,
  ...feedbackComponents,
  ...disclosureComponents,
  ...navigationComponents,
  ...layoutComponents,
  ...mediaComponents,
  ...reportComponents,
];
