// This layout intentionally does NOT include the dashboard layout.
// It replaces it entirely for the /space/* routes.
export default function SpaceLayout({ children }: { children: React.ReactNode }) {
  return (
      <body style={{ margin: 0, padding: 0, overflow: "hidden" }}>
        {children}
      </body>
 );
}