export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      {/* Subtle Dot-Matrix for Auth too */}
      <div className="fixed inset-0 dot-matrix pointer-events-none z-0" />
      
      <div className="w-full max-w-md relative z-10">{children}</div>
    </div>
  );
}
