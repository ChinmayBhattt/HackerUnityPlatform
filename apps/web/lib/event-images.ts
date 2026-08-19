import codewarsImg from '@/assets/CodeWars-2.png';
import clashOfCodersImg from '@/assets/clash-of-coders.jpeg';
import openaiHackathonImg from '@/assets/openai-hackathon.jpeg.jpeg';

/**
 * Maps event IDs to their statically-imported banner images.
 * Using Next.js static imports guarantees the images are always
 * bundled and available, unlike public/ URL strings which can
 * fail silently if the file is missing or the path is wrong.
 */
export const EVENT_IMAGE_MAP: Record<string, typeof codewarsImg> = {
  codewars: codewarsImg,
  'clash-of-coders': clashOfCodersImg,
  'chatgpt-codex': openaiHackathonImg,
};
