import type { Metadata } from "next";
import { AdminApp } from "./admin-app";

export const metadata: Metadata = {
  title: "IBO Admin",
  description: "IBO Creative website control panel",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminApp />;
}
