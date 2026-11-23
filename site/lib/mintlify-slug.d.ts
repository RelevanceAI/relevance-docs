import type { Heading, Root } from 'mdast';

export function mintlifyHeadingSlug(text: string): string;
export function mintlifySlug(root: Root, heading: Heading, text: string): string;
export function mintlifyAccordionSlug(text: string): string;
