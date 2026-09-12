// Minimal placeholder — full System Home build happens on the frontend branch.
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-6">
      <div className="hud-frame hud-panel max-w-md p-10 text-center">
        <p className="font-display text-xs tracking-[0.4em] text-violet">[SYSTEM ONLINE]</p>
        <h1 className="font-display mt-3 text-4xl text-ivory">SYSTEM HOME</h1>
        <p className="mt-3 text-sm text-mist">
          Signed in as {session?.user?.email ?? "player"}. Full System interface is under construction
          on the frontend branch.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => navigate("/inventory")} variant="outline">
            Inventory
          </Button>
          <Button onClick={() => navigate("/progress")} variant="outline">
            Progress
          </Button>
          <Button onClick={() => signOut()} variant="danger">
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
