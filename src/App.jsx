import BannerTool from "./components/BannerTool.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

export default function App() {
  return (
    <ErrorBoundary>
      <BannerTool />
    </ErrorBoundary>
  );
}
