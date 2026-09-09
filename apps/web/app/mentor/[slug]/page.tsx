import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMentorBySlug, VERIFIED_MENTORS } from '@/lib/mentors-data';
import { MentorProfileView } from '@/components/mentor-profile-view';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;

export function generateStaticParams() {
  return Object.values(VERIFIED_MENTORS).map((mentor) => ({
    slug: mentor.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const mentor = getMentorBySlug(decodedSlug);

  if (!mentor) {
    return {
      title: "Mentor Not Found | Hacker's Unity",
      robots: { index: false, follow: false },
    };
  }

  const title = `${mentor.name} – Official Verified Mentor | Hacker's Unity`;
  const description = `${mentor.headline} | Verified Mentor at Hacker's Unity. 12+ years software engineering & technology leadership experience.`;

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `https://hackersunity.com/mentor/${mentor.slug}`,
      images: [
        {
          url: mentor.avatarUrl,
          width: 800,
          height: 800,
          alt: `${mentor.name} – Hacker's Unity Verified Mentor`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [mentor.avatarUrl],
    },
  };
}

export default async function MentorPage({ params }: PageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const mentor = getMentorBySlug(decodedSlug);

  if (!mentor) {
    notFound();
  }

  return <MentorProfileView mentor={mentor} />;
}
