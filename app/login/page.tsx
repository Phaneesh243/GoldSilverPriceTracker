import { redirect } from "next/navigation";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  redirect("/?auth=login");
}
