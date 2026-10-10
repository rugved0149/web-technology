import { useAuth } from "../context/AuthContext";
import ClubManagerWorkspace from "../components/ClubManagerWorkspace";

export default function ClubManagerPage() {
  const { user, token } = useAuth();
  return <div className="container py-5"><ClubManagerWorkspace token={token} user={user} /></div>;
}
