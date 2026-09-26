import { BrowserRouter, Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import OrganizerRoute from './components/OrganizerRoute'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'
import CompetitionsPage from './pages/CompetitionsPage'
import CompetitionDetailPage from './pages/CompetitionDetailPage'
import TeamsPage from './pages/TeamsPage'
import TeamDetailPage from './pages/TeamDetailPage'
import PlayersPage from './pages/PlayersPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import OrganizerDashboardPage from './pages/organizer/OrganizerDashboardPage'
import CompetitionListPage from './pages/organizer/CompetitionListPage'
import CreateCompetitionPage from './pages/organizer/CreateCompetitionPage'
import EditCompetitionPage from './pages/organizer/EditCompetitionPage'
import OrganizerTeamsPage from './pages/organizer/OrganizerTeamsPage'
import TeamCreatePage from './pages/organizer/TeamCreatePage'
import TeamEditPage from './pages/organizer/TeamEditPage'
import TeamSquadPage from './pages/organizer/TeamSquadPage'
import FixturesPage from './pages/organizer/FixturesPage'
import FixtureCreatePage from './pages/organizer/FixtureCreatePage'
import FixtureEditPage from './pages/organizer/FixtureEditPage'
import FixtureResultPage from './pages/organizer/FixtureResultPage'
import MatchDetailPage from './pages/MatchDetailPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/competitions" element={<CompetitionsPage />} />
          <Route path="/competitions/:slug" element={<CompetitionDetailPage />} />
          <Route path="/matches/:matchId" element={<MatchDetailPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/:slug" element={<TeamDetailPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer"
            element={
              <OrganizerRoute>
                <OrganizerDashboardPage />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/competitions"
            element={
              <OrganizerRoute>
                <CompetitionListPage />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/competitions/new"
            element={
              <OrganizerRoute>
                <CreateCompetitionPage />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/competitions/:id/edit"
            element={
              <OrganizerRoute>
                <EditCompetitionPage />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/competitions/:id/fixtures"
            element={
              <OrganizerRoute>
                <FixturesPage />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/competitions/:id/fixtures/new"
            element={
              <OrganizerRoute>
                <FixtureCreatePage />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/competitions/:id/fixtures/:fixtureId/edit"
            element={
              <OrganizerRoute>
                <FixtureEditPage />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/fixtures/:fixtureId/result"
            element={
              <OrganizerRoute>
                <FixtureResultPage />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/teams"
            element={
              <OrganizerRoute>
                <OrganizerTeamsPage />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/teams/new"
            element={
              <OrganizerRoute>
                <TeamCreatePage />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/teams/:id/edit"
            element={
              <OrganizerRoute>
                <TeamEditPage />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/teams/:id/squad"
            element={
              <OrganizerRoute>
                <TeamSquadPage />
              </OrganizerRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}