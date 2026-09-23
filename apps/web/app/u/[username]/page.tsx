import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{
    username: string;
  }>;
}

export default async function ShortProfileRedirect({ params }: Props) {
  const { username } = await params;
  redirect(`/profile/${encodeURIComponent(username)}`);
}
