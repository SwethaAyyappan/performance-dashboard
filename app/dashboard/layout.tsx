export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh", color: "#fff" }}>
      {children}
    </div>
  );
}
