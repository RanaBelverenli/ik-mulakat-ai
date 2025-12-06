import { AdminRoute } from "@/components/shared/AdminRoute";

export default function InterviewReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminRoute>{children}</AdminRoute>;
}

