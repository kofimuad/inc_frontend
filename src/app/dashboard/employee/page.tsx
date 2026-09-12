import { redirect } from "next/navigation";

// The employee dashboard has been unified with the Parcel Console — staff work
// entirely from /parcels now. This redirect keeps old links/bookmarks working.
export default function EmployeeDashboard() {
  redirect("/parcels");
}
