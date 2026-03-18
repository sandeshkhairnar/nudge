// This layout intentionally does NOT include the dashboard layout.
// It replaces it entirely for the /space/* routes.
export default function SpaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>);
}