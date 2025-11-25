// app/index.js
import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth/auth-context";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/auth/login" />;
}
