import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout.jsx";
import HomePage from "../modules/home/HomePage.jsx";
import ExpensesPage from "../modules/expenses/ExpensesPage.jsx";
import GymPage from "../modules/gym/GymPage.jsx";
import JobsPage from "../modules/jobs/JobsPage.jsx";
import LootPage from "../modules/loot/LootPage.jsx";
import MediaPage from "../modules/media/MediaPage.jsx";
import BucketListPage from "../modules/bucketList/BucketListPage.jsx";
import PlacesPage from "../modules/places/PlacesPage.jsx";
import LibraryPage from "../modules/library/LibraryPage.jsx";
import SettingsPage from "../modules/settings/SettingsPage.jsx";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/gym" element={<GymPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/loot" element={<LootPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/bucket-list" element={<BucketListPage />} />
          <Route path="/places" element={<PlacesPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;