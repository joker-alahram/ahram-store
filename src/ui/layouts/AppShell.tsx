import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <TopBar />
      <main className="main-content">{children}</main>
      <BottomNav />
    </div>
  )
}
