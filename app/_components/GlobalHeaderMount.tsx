import { fetchOwnProfile } from '@/lib/user-queries'
import GlobalHeader, { type GlobalHeaderUser } from './GlobalHeader'

export default async function GlobalHeaderMount() {
  const profile = await fetchOwnProfile()
  const user: GlobalHeaderUser = profile
    ? {
        displayName: profile.displayName,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        isAdmin: profile.isAdmin,
      }
    : null

  return <GlobalHeader user={user} />
}
