import { redirect } from "next/navigation"

export default function Page() {
  // Redirect to the new Login page
  redirect("/login")
}
