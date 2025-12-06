import { AdminRoute } from "@/components/shared/AdminRoute";

export default function InterviewAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminRoute>{children}</AdminRoute>;
}


