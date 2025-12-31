import Topbar from "./_components/Topbar";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* @ts-expect-error Async Server Component */}
      <Topbar />
      <div className="card">
        <h1 style={{margin:"0 0 6px 0"}}>Greek God Aesthetic Meal Planner</h1>
        <p className="small" style={{marginTop:0}}>
          Real app starter: Google login, 7-day plan + grocery list export, check-ins, and admin macro tweaks with regeneration.
        </p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <Link className="btn" href="/login">Login / Sign up</Link>
          <Link className="btn secondary" href="/app">Open Planner</Link>
        </div>
      </div>
    </>
  );
}
