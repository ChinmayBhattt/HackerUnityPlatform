import { Metadata } from 'next';
import { MentorPortalClient } from './mentor-portal-client';

export const metadata: Metadata = {
  title: "Verify Mentor Credential & Mentor Network | Hacker's Unity",
  description:
    "Official verification portal for Hacker's Unity verified mentors and hackathon jury members. Check credential authenticity or apply to join our mentor network.",
  openGraph: {
    title: "Verify Mentor Credential & Mentor Network | Hacker's Unity",
    description:
      "Verify accredited mentors or apply to join India's fastest-growing hackathon community as a verified mentor & technical jury member.",
    url: 'https://hackersunity.com/mentor',
    images: ['https://hackersunity.com/logo.png'],
  },
};

export default function MentorPortalPage() {
  return <MentorPortalClient />;
}
